import { prisma } from '@/lib/db';

interface RoomStatusCardProps {
  propertyId: string;
}

export async function RoomStatusCard({ propertyId }: RoomStatusCardProps) {
  const lease = await prisma.lease.findFirst({
    where: {
      propertyId,
      leaseStatus: 'active',
    },
    include: {
      room: true,
    },
  });

  if (!lease) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold text-card-foreground">Your room</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have an active room yet. Tap below to request one.
        </p>
        <button className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Request a room
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold text-card-foreground">Your stay</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Room {lease.room.roomNumber} • Floor {lease.room.floor}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Check-in: {new Date(lease.startDate).toLocaleDateString()} • Check-out:{' '}
        {new Date(lease.endDate).toLocaleDateString()}
      </p>
    </div>
  );
}

