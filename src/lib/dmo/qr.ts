import QRCode from "qrcode";

export function publicBaseUrl(): string {
  return (process.env.NM_EX_PUBLIC_URL || "https://www.nm-ex.com").replace(/\/$/, "");
}

export function verifyUrl(certNo: string): string {
  return `${publicBaseUrl()}/verify?no=${encodeURIComponent(certNo)}`;
}

export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#101512", light: "#ffffff00" },
  });
}
