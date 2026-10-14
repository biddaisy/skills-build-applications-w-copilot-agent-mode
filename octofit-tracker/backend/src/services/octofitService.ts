import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: string;
    teamId?: string;
    type?: unknown;
    minutes?: unknown;
  };

  if (!userId || !teamId || typeof type !== 'string' || !type.trim() || minutes === undefined || minutes === null || Number.isNaN(Number(minutes)) || Number(minutes) <= 0) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and minutes'), { status: 400 });
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid ObjectIds'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity userId and teamId must reference existing records'), { status: 400 });
  }

  const normalizedMinutes = Number(minutes);
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes: normalizedMinutes,
    points: normalizedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members)) {
    throw Object.assign(new Error('Team members must be an array'), { status: 400 });
  }

  for (const member of members) {
    if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
      throw Object.assign(new Error('Team members must be valid ObjectIds'), { status: 400 });
    }
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: members.map((member) => new mongoose.Types.ObjectId(member)),
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

function normalizeFocus(type?: string) {
  const value = type?.toLowerCase();
  if (!value) return undefined;

  const focusMap: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'mobility',
    hike: 'endurance',
    swim: 'endurance',
    row: 'endurance',
    strength: 'strength',
    lift: 'strength',
    power: 'strength',
    sprint: 'endurance',
    yoga: 'mobility',
    stretch: 'mobility',
    mobility: 'mobility',
    recovery: 'mobility',
  };

  return focusMap[value] ?? value;
}

export async function suggestWorkouts(userEmail: string) {
  const email = decodeURIComponent(userEmail ?? '').trim();
  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const preferredFocus = user.fitnessGoal ?? normalizeFocus(recentActivity?.type) ?? 'endurance';
  const recentFocus = normalizeFocus(recentActivity?.type) ?? preferredFocus;

  const workouts = await Workout.find().lean();
  const rankedWorkouts = workouts
    .map((workout) => {
      let score = 0;
      if (workout.focus === preferredFocus) score += 2;
      if (workout.focus === recentFocus && recentFocus !== preferredFocus) score += 1;
      return { ...workout, score };
    })
    .sort((left, right) => right.score - left.score || left.minutes - right.minutes)
    .slice(0, 3)
    .map((workout) => {
      const recentType = recentActivity?.type ?? preferredFocus;
      const reason = `Based on your recent ${recentType} activity and ${preferredFocus} goal, this ${workout.focus} workout matches your current pattern.`;
      return {
        ...workout,
        reason,
      };
    });

  return rankedWorkouts;
}

export { User };
