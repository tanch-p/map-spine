import * as THREE from "three";
import { GameConfig } from "./GameConfig";

export class TileManager {
	constructor(map = "") {
		const gridSize = GameConfig.gridSize;
		const floorIcons = GameConfig.sprites.get("floorIcons");
	}

	get(tileName) {
		const boxGroup = new THREE.Group();
		let geometry;
		let sideMaterial, topMaterial;
		let topTexture;
		let depth = 0,
			size = 1;
		switch (tileName) {
			case "tile_forbidden":
				depth = 40;
				geometry = new THREE.BoxGeometry(
					GameConfig.gridSize,
					GameConfig.gridSize,
					40
				);
				sideMaterial = new THREE.MeshStandardMaterial({
					color: 0xb8b8b8,
				});
				topMaterial = new THREE.MeshStandardMaterial({
					color: 0x232323,
				});
				break;
			case "tile_wall":
				depth = 40;
				geometry = new THREE.BoxGeometry(
					GameConfig.gridSize,
					GameConfig.gridSize,
					40
				);
				sideMaterial = new THREE.MeshStandardMaterial({
					color: 0xff8108,
				});
				topMaterial = new THREE.MeshStandardMaterial({
					color: 0xc1c1c1,
				});
				topTexture = GameConfig.sprites.get("tile_wall");
				break;
			case "tile_hole":
				// Material for the box
				const material = new THREE.MeshStandardMaterial({
					color: 0xc1c1c1,
					side: THREE.DoubleSide,
				});
				const topAttachmentDepth = 7;
				const topHazardDepth = 9;
				const topHazardWidth = GameConfig.gridSize - topAttachmentDepth * 2;
				const vertHazard = GameConfig.sprites.get("hole_hazard_vert");
				const vertHazardTexture = this.getTopTexture(
					vertHazard,
					size,
					topHazardDepth,
					new THREE.PlaneGeometry(topHazardDepth, topHazardWidth)
				);
				const horizHazard = GameConfig.sprites.get("hole_hazard_horiz");
				const horizHazardTexture = this.getTopTexture(
					horizHazard,
					size,
					topHazardDepth,
					new THREE.PlaneGeometry(topHazardWidth, topHazardDepth)
				);
				// Create the four walls
				// Bottom wall
				const bottomWall = new THREE.Mesh(
					new THREE.BoxGeometry(GameConfig.gridSize, 2, GameConfig.gridSize),
					material
				);
				bottomWall.position.y = -GameConfig.gridSize / 2;
				boxGroup.add(bottomWall);
				const btmTopAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(
						GameConfig.gridSize,
						topAttachmentDepth,
						topAttachmentDepth
					),
					material
				);
				btmTopAttachment.position.y =
					-GameConfig.gridSize / 2 + topAttachmentDepth / 2;
				btmTopAttachment.position.z =
					GameConfig.gridSize / 2 - topAttachmentDepth / 2;
				boxGroup.add(btmTopAttachment);
				const btmBtmAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(GameConfig.gridSize, 10, 10),
					material
				);
				btmBtmAttachment.position.y = -GameConfig.gridSize / 2 + 10 / 2;
				btmBtmAttachment.position.z = -GameConfig.gridSize / 2 + 10 / 2;
				boxGroup.add(btmBtmAttachment);
				//hazard
				const btmTopHazard = new THREE.Mesh(
					new THREE.BoxGeometry(topHazardWidth, topHazardDepth, topHazardDepth),
					material
				);					
				const btmHazardGroup = new THREE.Group();
				btmHazardGroup.position.y =
					-GameConfig.gridSize / 2 + topHazardDepth / 2 + topAttachmentDepth;
				btmHazardGroup.position.z =
				GameConfig.gridSize / 2 - topAttachmentDepth / 2 - 10;
				btmHazardGroup.add(btmTopHazard);
				btmHazardGroup.add(horizHazardTexture.clone());
				boxGroup.add(btmHazardGroup);

				// Top wall
				const topWall = new THREE.Mesh(
					new THREE.BoxGeometry(GameConfig.gridSize, 2, GameConfig.gridSize),
					material
				);
				topWall.position.y = GameConfig.gridSize / 2;
				boxGroup.add(topWall);
				const topTopAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(
						GameConfig.gridSize,
						topAttachmentDepth,
						topAttachmentDepth
					),
					material
				);
				topTopAttachment.position.y =
					GameConfig.gridSize / 2 - topAttachmentDepth / 2;
				topTopAttachment.position.z =
					GameConfig.gridSize / 2 - topAttachmentDepth / 2;
				boxGroup.add(topTopAttachment);
				const topBtmAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(GameConfig.gridSize, 10, 10),
					material
				);
				topBtmAttachment.position.y = GameConfig.gridSize / 2 - 10 / 2;
				topBtmAttachment.position.z = -GameConfig.gridSize / 2 + 10 / 2;
				boxGroup.add(topBtmAttachment);
				//hazard
				const topTopHazard = new THREE.Mesh(
					new THREE.BoxGeometry(topHazardWidth, topHazardDepth, topHazardDepth),
					material
				);					
				const topHazardGroup = new THREE.Group();
				topHazardGroup.position.y =
					GameConfig.gridSize / 2 - topHazardDepth / 2 - topAttachmentDepth;
				topHazardGroup.position.z =
				GameConfig.gridSize / 2 - topAttachmentDepth / 2 - 10;
				topHazardGroup.add(topTopHazard);
				topHazardGroup.add(horizHazardTexture.clone());
				boxGroup.add(topHazardGroup);

				// Left wall
				const leftWall = new THREE.Mesh(
					new THREE.BoxGeometry(2, GameConfig.gridSize, GameConfig.gridSize),
					material
				);
				leftWall.position.x = -GameConfig.gridSize / 2;
				boxGroup.add(leftWall);
				const leftTopAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(
						topAttachmentDepth,
						GameConfig.gridSize,
						topAttachmentDepth
					),
					material
				);
				leftTopAttachment.position.x =
					-GameConfig.gridSize / 2 + topAttachmentDepth / 2;
				leftTopAttachment.position.z =
					GameConfig.gridSize / 2 - topAttachmentDepth / 2;
				boxGroup.add(leftTopAttachment);
				const leftBtmAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(10, GameConfig.gridSize, 10),
					material
				);
				leftBtmAttachment.position.x = -GameConfig.gridSize / 2 + 10 / 2;
				leftBtmAttachment.position.z = -GameConfig.gridSize / 2 + 10 / 2;
				boxGroup.add(leftBtmAttachment);

				//hazard
				const leftTopHazard = new THREE.Mesh(
					new THREE.BoxGeometry(topHazardDepth, topHazardWidth, topHazardDepth),
					material
				);
				const leftHazardGroup = new THREE.Group();
				leftHazardGroup.position.x =
					-GameConfig.gridSize / 2 + topHazardDepth / 2 + topAttachmentDepth;
				leftHazardGroup.position.z =
					GameConfig.gridSize / 2 - topHazardDepth / 2 - 10;
				leftHazardGroup.add(leftTopHazard);
				leftHazardGroup.add(vertHazardTexture.clone());
				boxGroup.add(leftHazardGroup);

				// Right wall
				const rightWall = new THREE.Mesh(
					new THREE.BoxGeometry(2, GameConfig.gridSize, GameConfig.gridSize),
					material
				);
				rightWall.position.x = GameConfig.gridSize / 2;
				boxGroup.add(rightWall);
				const rightTopAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(
						topAttachmentDepth,
						GameConfig.gridSize,
						topAttachmentDepth
					),
					material
				);
				rightTopAttachment.position.x =
					GameConfig.gridSize / 2 - topAttachmentDepth / 2;
				rightTopAttachment.position.z =
					GameConfig.gridSize / 2 - topAttachmentDepth / 2;
				boxGroup.add(rightTopAttachment);
				const rightBtmAttachment = new THREE.Mesh(
					new THREE.BoxGeometry(10, GameConfig.gridSize, 10),
					material
				);
				rightBtmAttachment.position.x = GameConfig.gridSize / 2 + 10 / 2;
				rightBtmAttachment.position.z = -GameConfig.gridSize / 2 + 10 / 2;
				boxGroup.add(rightBtmAttachment);
				//hazard
				const rightTopHazard = new THREE.Mesh(
					new THREE.BoxGeometry(topHazardDepth, topHazardWidth, topHazardDepth),
					material
				);
				const rightHazardGroup = new THREE.Group();
				rightHazardGroup.position.x =
					GameConfig.gridSize / 2 - topHazardDepth / 2 - topAttachmentDepth;
				rightHazardGroup.position.z =
					GameConfig.gridSize / 2 - topHazardDepth / 2 - 10;
				rightHazardGroup.add(rightTopHazard);
				rightHazardGroup.add(vertHazardTexture.clone());
				boxGroup.add(rightHazardGroup);

				// Black material for the base (hole effect)
				const baseMaterial = new THREE.MeshStandardMaterial({
					color: 0x232323,
					side: THREE.DoubleSide,
				});

				const base = new THREE.Mesh(
					new THREE.BoxGeometry(
						GameConfig.gridSize - 10,
						GameConfig.gridSize - 10,
						2
					),
					baseMaterial
				);
				// Position at the back of the box
				base.position.z = -(GameConfig.gridSize / 2 + 2);
				boxGroup.add(base);

				return boxGroup;
			case "tile_floor":
				topTexture = GameConfig.sprites.get("tile_floor");
				size = 0.84;
			default:
				geometry = new THREE.PlaneGeometry(
					GameConfig.gridSize,
					GameConfig.gridSize
				);
				const box = new THREE.Mesh(
					geometry,
					new THREE.MeshStandardMaterial({
						color: 0xd1d1d1,
					})
				);
				const edges = new THREE.EdgesGeometry(geometry);
				const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x484848 });
				const edgeLines = new THREE.LineSegments(edges, edgesMaterial);
				boxGroup.add(box);
				boxGroup.add(edgeLines);
				if (topTexture) {
					const frontPlane = this.getTopTexture(topTexture, size, depth);
					boxGroup.add(frontPlane);
				}
				return boxGroup;
		}
		const materials = [
			sideMaterial, // right
			sideMaterial, // left
			sideMaterial, // front
			sideMaterial, // back
			topMaterial, // top (+Z)
			topMaterial, // bottom (-Z)
		];

		const box = new THREE.Mesh(geometry, materials);
		const edges = new THREE.EdgesGeometry(geometry);
		const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x484848 });
		const edgeLines = new THREE.LineSegments(edges, edgesMaterial);
		boxGroup.add(box);
		boxGroup.add(edgeLines);
		if (topTexture) {
			const frontPlane = this.getTopTexture(topTexture, size, depth);
			boxGroup.add(frontPlane);
		}
		return boxGroup;
	}
	getTopTexture(topTexture, size, depth, customGeometry) {
		const { texture, config } = topTexture;
		const { UVWidth, UVHeight, uvOffsetX, uvOffsetY } = config;
		const frontMaterial = new THREE.MeshStandardMaterial({
			map: texture,
			transparent: true,
		});
		const frontGeometry =
			customGeometry ||
			new THREE.PlaneGeometry(
				GameConfig.gridSize * size,
				GameConfig.gridSize * size
			);
		const frontPlane = new THREE.Mesh(frontGeometry, frontMaterial);

		// Modify UV coordinates to match the specific tile in the sprite sheet
		const uvs = frontGeometry.attributes.uv;
		const uvArray = uvs.array;

		// Set UV coordinates for each vertex
		// Bottom left
		uvArray[0] = uvOffsetX;
		uvArray[1] = uvOffsetY;
		// Bottom right
		uvArray[2] = uvOffsetX + UVWidth;
		uvArray[3] = uvOffsetY;
		// Top left
		uvArray[4] = uvOffsetX;
		uvArray[5] = uvOffsetY + UVHeight;
		// Top right
		uvArray[6] = uvOffsetX + UVWidth;
		uvArray[7] = uvOffsetY + UVHeight;

		// Position front plane at the front of the box
		frontPlane.position.z = depth / 2 + 1;
		frontPlane.rotateZ(Math.PI);
		frontPlane.renderOrder = -1;
		return frontPlane;
	}
}
