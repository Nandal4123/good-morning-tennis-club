import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function resetData() {
  try {
    console.log('🗑️  Deleting all data...\n');

    // Delete in order due to foreign key constraints
    const deletedFeedbacks = await prisma.feedback.deleteMany();
    console.log(`✅ Deleted ${deletedFeedbacks.count} feedbacks`);

    const deletedParticipants = await prisma.matchParticipant.deleteMany();
    console.log(`✅ Deleted ${deletedParticipants.count} match participants`);

    const deletedMatches = await prisma.match.deleteMany();
    console.log(`✅ Deleted ${deletedMatches.count} matches`);

    const deletedAttendances = await prisma.attendance.deleteMany();
    console.log(`✅ Deleted ${deletedAttendances.count} attendances`);

    const deletedSessions = await prisma.session.deleteMany();
    console.log(`✅ Deleted ${deletedSessions.count} sessions`);

    const deletedUsers = await prisma.user.deleteMany();
    console.log(`✅ Deleted ${deletedUsers.count} users`);

    console.log('\n🎾 All data has been deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetData();

