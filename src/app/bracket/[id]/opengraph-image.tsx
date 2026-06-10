import {
  renderBracketShareImage,
  SHARE_IMAGE_ALT,
  SHARE_IMAGE_CONTENT_TYPE,
  SHARE_IMAGE_SIZE,
} from "@/lib/bracket/share-image";
import { buildBracketShareModel } from "@/lib/bracket/share-model";
import { getBracketById } from "@/lib/leaderboard/store";

export const alt = SHARE_IMAGE_ALT;
export const size = SHARE_IMAGE_SIZE;
export const contentType = SHARE_IMAGE_CONTENT_TYPE;

export default async function BracketOpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bracket = await getBracketById(id);

  return renderBracketShareImage(bracket ? buildBracketShareModel(bracket) : null);
}
