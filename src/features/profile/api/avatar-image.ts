import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import type { ImagePickerAsset } from 'expo-image-picker'

/** Matches `game.avatar.output_dimension`; the API rejects uploads larger than 1024px or 2 MB. */
const AVATAR_SIZE = 512

export interface PreparedAvatar {
  uri: string
  name: string
  type: string
}

/**
 * Centre-crops the picked photo to a square, downsizes it and re-encodes as JPEG so that
 * phone photos satisfy the API's dimension / size limits before upload.
 */
export async function prepareAvatar(asset: ImagePickerAsset): Promise<PreparedAvatar> {
  const side = Math.min(asset.width, asset.height)
  const context = ImageManipulator.manipulate(asset.uri)

  if (asset.width !== asset.height) {
    context.crop({
      originX: Math.floor((asset.width - side) / 2),
      originY: Math.floor((asset.height - side) / 2),
      width: side,
      height: side,
    })
  }

  if (side > AVATAR_SIZE) {
    context.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
  }

  const image = await context.renderAsync()
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 })

  return { uri: result.uri, name: 'avatar.jpg', type: 'image/jpeg' }
}

export function buildAvatarForm(file: PreparedAvatar): FormData {
  const form = new FormData()
  // React Native's FormData accepts { uri, name, type } descriptors in place of Blobs.
  form.append('avatar', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob)
  return form
}
