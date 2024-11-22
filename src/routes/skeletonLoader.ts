// SkeletonLoader.js
import { TextureLoader } from "three";
import {
  SkeletonBinary,
  AtlasAttachmentLoader,
} from "@esotericsoftware/spine-core";

export class SpineLoader {
  constructor() {
    this.textureLoader = new TextureLoader();
  }

  async loadSpineAnimation(skelPath, atlasPath, texturePath) {
    try {
      // Load the atlas file
      const atlasText = await fetch(atlasPath).then((response) =>
        response.text()
      );

      // Load the texture
      const texture = await new Promise((resolve, reject) => {
        this.textureLoader.load(texturePath, resolve, undefined, reject);
      });

      // Create atlas
      const atlas = new Atlas(atlasText);
      atlas.setTextures({ default: texture });

      // Create attachment loader
      const attachmentLoader = new AtlasAttachmentLoader(atlas);

      // Load skeleton file
      const skelResponse = await fetch(skelPath);
      const skelData = await skelResponse.arrayBuffer();

      // Parse skeleton
      const binary = new SkeletonBinary(attachmentLoader);
      binary.scale = 1;
      const skeletonData = binary.readSkeletonData(new Uint8Array(skelData));

      return {
        skeletonData,
        atlas,
      };
    } catch (error) {
      console.error("Error loading spine animation:", error);
      throw error;
    }
  }
}
