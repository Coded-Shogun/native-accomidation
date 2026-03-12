import { prisma } from '@/lib/db';
import QRCode from 'qrcode';

interface WifiWidgetProps {
  propertyId: string;
}

async function generateWifiQr(ssid: string, password: string): Promise<string> {
  const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
  return QRCode.toDataURL(wifiString);
}

export async function WifiWidget({ propertyId }: WifiWidgetProps) {
  const ap = await prisma.wifiAccessPoint.findFirst({
    where: { propertyId, isActive: true },
  });

  if (!ap) {
    return null;
  }

  const qr = await generateWifiQr(ap.ssid, ap.password);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold text-card-foreground">Wi-Fi</h2>
      <p className="mt-1 text-xs text-muted-foreground">SSID: {ap.ssid}</p>
      <div className="mt-3 flex items-center gap-3">
        <img src={qr} alt="Wi-Fi QR code" className="h-24 w-24 rounded-md border bg-white" />
        <p className="text-xs text-muted-foreground">
          Scan this code with your phone&apos;s camera to connect to the Wi‑Fi.
        </p>
      </div>
    </div>
  );
}

