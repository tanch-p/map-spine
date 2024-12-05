import * as THREE from "three";

class MapGrids extends THREE.LineSegments {
  constructor( 
		width = 10, 
		height = 10, 
		xDivisions = 10, 
		yDivisions = 10, 
		color1 = 0x444444, 
		color2 = 0x888888 
	) {
		color1 = new THREE.Color( color1 );
		color2 = new THREE.Color( color2 );
		
		const halfWidth = width / 2;
		const halfHeight = height / 2;
		
		const stepX = width / xDivisions;
		const stepY = height / yDivisions;
		
		const vertices = [], colors = [];
		
		// Vertical lines (along X-axis)
		for ( let i = 0; i <= xDivisions; i++ ) {
			const x = -halfWidth + i * stepX;
			vertices.push( x, -halfHeight, 0, x, halfHeight, 0 );
			
			const color = (i === Math.floor(xDivisions/2)) ? color1 : color2;
			color.toArray( colors, colors.length );
			color.toArray( colors, colors.length );
		}
		
		// Horizontal lines (along Y-axis)
		for ( let j = 0; j <= yDivisions; j++ ) {
			const y = -halfHeight + j * stepY;
			vertices.push( -halfWidth, y, 0, halfWidth, y, 0 );
			
			const color = (j === Math.floor(yDivisions/2)) ? color1 : color2;
			color.toArray( colors, colors.length );
			color.toArray( colors, colors.length );
		}
		
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
		
		const material = new THREE.LineBasicMaterial( { vertexColors: true, toneMapped: false } );
		
		super( geometry, material );
		
		this.type = 'XYGridHelper';
	}
	
	dispose() {
		this.geometry.dispose();
		this.material.dispose();
	}
}

export { MapGrids };
