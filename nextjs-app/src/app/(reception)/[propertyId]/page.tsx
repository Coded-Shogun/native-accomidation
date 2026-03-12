import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { RoomStatusCard } from '@/components/reception/RoomStatusCard';
import { HouseRulesCard } from '@/components/reception/HouseRulesCard';
import { WifiWidget } from '@/components/reception/WifiWidget';

interface ReceptionPageProps {
  params: { propertyId: string };
}

export default async function ReceptionPage({ params }: ReceptionPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/reception/${params.propertyId}`);
  }

  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    select: {
      id: true,
      name: true,
      houseRules: true,
    },
  });

  if (!property) {
    redirect('/404');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">{property.name}</h1>
      <RoomStatusCard propertyId={property.id} />
      <HouseRulesCard markdown={property.houseRules || 'No house rules have been set yet.'} />
      <WifiWidget propertyId={property.id} />
    </div>
  );
}

