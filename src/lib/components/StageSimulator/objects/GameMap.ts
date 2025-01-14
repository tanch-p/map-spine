import * as THREE from 'three';
import { Enemy } from './Enemy';

export class GameMap {
    scene: THREE.Scene;
    enemies: Enemy[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    addEnemy(enemy: Enemy): void {
        this.enemies.push(enemy);
    }

    update(deltaTime: number, currentTime: number): void {
        for (const enemy of this.enemies) {
            enemy.move(deltaTime);
        }

        for (const projectile of this.projectiles) {
            projectile.move(deltaTime);
        }
    }
}
