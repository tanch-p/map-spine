import * as THREE from 'three';

interface Waypoint {
    x: number;
    y: number;
    z: number;
}

export class Enemy {
    path: Waypoint[];
    health: number;
    speed: number;
    currentWaypoint: number;
    position: THREE.Vector3;
    mesh: THREE.Mesh;

    constructor(path: Waypoint[], health: number, speed: number, scene: THREE.Scene) {
        this.path = path;
        this.health = health;
        this.speed = speed;
        this.currentWaypoint = 0;
        this.position = new THREE.Vector3(path[0].x, path[0].y, path[0].z);

        const geometry = new THREE.SphereGeometry(2, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);

        scene.add(this.mesh);
    }

    move(deltaTime: number): void {
        if (this.currentWaypoint < this.path.length - 1) {
            const target = new THREE.Vector3(
                this.path[this.currentWaypoint + 1].x,
                this.path[this.currentWaypoint + 1].y,
                this.path[this.currentWaypoint + 1].z
            );
            const direction = target.clone().sub(this.position).normalize();

            this.position.add(direction.multiplyScalar(this.speed * deltaTime));
            this.mesh.position.copy(this.position);

            if (this.position.distanceTo(target) < 0.1) {
                this.currentWaypoint++;
            }
        }
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.onDeath();
        }
    }

    onDeath(): void {
        this.mesh.material.color.set(0x000000);
    }
}
