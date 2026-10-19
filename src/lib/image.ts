import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export type PickedImage = { uri: string; width: number; height: number };

/**
 * Reduz (nunca amplia) e comprime uma imagem da câmera/galeria para JPEG.
 * Equivalente ao fileToCompressedDataUrl do web (mesmos tamanhos máximos).
 */
export async function compressImage(
  image: PickedImage,
  maxSize: number,
  quality: number,
): Promise<{ uri: string; base64: string; dataUrl: string }> {
  const context = ImageManipulator.manipulate(image.uri);
  const longest = Math.max(image.width, image.height);
  if (longest > maxSize && image.width > 0 && image.height > 0) {
    const scale = maxSize / longest;
    context.resize({
      width: Math.round(image.width * scale),
      height: Math.round(image.height * scale),
    });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: quality,
    format: SaveFormat.JPEG,
    base64: true,
  });
  const base64 = saved.base64 ?? "";
  return { uri: saved.uri, base64, dataUrl: `data:image/jpeg;base64,${base64}` };
}

/** base64 → ArrayBuffer (upload binário para o Supabase Storage). */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
