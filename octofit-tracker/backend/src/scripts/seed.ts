import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

const TEAM_FIXTURES = [
  { name: 'Octocats', mascot: 'Mona' },
  { name: 'Robocats', mascot: 'Hubot' },
  { name: 'Codecats', mascot: 'Copilot' },
];

const USER_FIXTURES = [
  { name: 'Mona', email: 'mona@example.com', teamName: 'Octocats', fitnessGoal: 'endurance' },
  { name: 'Hubot', email: 'hubot@example.com', teamName: 'Robocats', fitnessGoal: 'strength' },
  { name: 'Ava', email: 'ava@example.com', teamName: 'Codecats', fitnessGoal: 'mobility' },
];

const ACTIVITY_FIXTURES = [
  { userEmail: 'mona@example.com', teamName: 'Octocats', type: 'run', minutes: 40, points: 40, occurredAt: new Date('2026-01-10T12:00:00.000Z') },
  { userEmail: 'hubot@example.com', teamName: 'Robocats', type: 'cycle', minutes: 25, points: 25, occurredAt: new Date('2026-01-11T12:00:00.000Z') },
  { userEmail: 'ava@example.com', teamName: 'Codecats', type: 'walk', minutes: 30, points: 30, occurredAt: new Date('2026-01-12T12:00:00.000Z') },
];

const WORKOUT_FIXTURES = [
  { title: 'Intervals', focus: 'endurance', minutes: 30, difficulty: 'moderate' },
  { title: 'Strength Circuit', focus: 'strength', minutes: 30, difficulty: 'moderate' },
  { title: 'Mobility Flow', focus: 'mobility', minutes: 20, difficulty: 'easy' },
];

async function upsertTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { name },
    { $set: { name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

async function upsertActivity({ userEmail, teamName, type, minutes, points, occurredAt }: (typeof ACTIVITY_FIXTURES)[number]) {
  const user = await User.findOne({ email: userEmail }).select('_id');
  const team = await Team.findOne({ name: teamName }).select('_id');
  if (!user || !team) {
    return null;
  }

  return Activity.findOneAndUpdate(
    { user: user._id, team: team._id, type, occurredAt },
    { $set: { user: user._id, team: team._id, type, minutes, points, occurredAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertWorkout({ title, focus, minutes, difficulty }: (typeof WORKOUT_FIXTURES)[number]) {
  return Workout.findOneAndUpdate(
    { title },
    { $set: { title, focus, minutes, difficulty } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const teams = new Map<string, InstanceType<typeof Team>>();
    for (const fixture of TEAM_FIXTURES) {
      const team = await upsertTeam(fixture.name, fixture.mascot);
      teams.set(fixture.name, team);
    }

    for (const fixture of USER_FIXTURES) {
      const team = teams.get(fixture.teamName);
      if (!team) continue;
      await upsertDemoUser(fixture.name, fixture.email, team._id, fixture.fitnessGoal);
    }

    for (const fixture of ACTIVITY_FIXTURES) {
      await upsertActivity(fixture);
    }

    for (const fixture of WORKOUT_FIXTURES) {
      await upsertWorkout(fixture);
    }
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
