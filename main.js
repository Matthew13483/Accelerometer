canvas.width = 350;
canvas.height = 350;
const ctx = canvas.getContext('2d');

function cllnLineLine(l1, l2) {
	let x1 = l1.p1.x;
	let y1 = l1.p1.y;
	let x2 = l1.p2.x;
	let y2 = l1.p2.y;
	let x3 = l2.p1.x;
	let y3 = l2.p1.y;
	let x4 = l2.p2.x;
	let y4 = l2.p2.y;
	let den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;
	if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
		return {
			x: x1 + ua * (x2 - x1),
			y: y1 + ua * (y2 - y1)
		};
	}
	return false;
}

function start() {
	button1.style.display = 'none';
	loop();
}

const Balls = [];

class Ball {
	constructor(x = canvas.width / 2, y = canvas.height / 2, r = 15) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.color = '#e04040';
		this.vel = {
			x: 0,
			y: 0
		}
		Balls.push(this);
	}
	loop() {
		let fr = 0.2;
		let aclx = acl.x * -fr;
		let acly = acl.y * fr;
		this.vel.x += aclx;
		this.vel.y += acly;
		this.x += this.vel.x;
		this.y += this.vel.y;
		let friction = 0.9;
		if (this.x < this.r) {
			this.x = this.r;
			this.vel.x *= -friction;
		}
		if (this.x > canvas.width - this.r) {
			this.x = canvas.width - this.r;
			this.vel.x *= -friction;
		}
		if (this.y < this.r) {
			this.y = this.r;
			this.vel.y *= -friction;
		}
		if (this.y > canvas.height - this.r) {
			this.y = canvas.height - this.r;
			this.vel.y *= -friction;
		}
		walls.forEach(wall => {
			if (wall.orient) {
				if (Math.abs(this.y - wall.p1.y) < this.r && this.x > wall.p1.x && this.x < wall.p2.x) {
					let dy = Math.sign(this.y - wall.p1.y) * this.r
					this.y = wall.p1.y + dy;
					this.vel.y *= -friction;
				}
			}
			else {
				if (Math.abs(this.x - wall.p1.x) < this.r && this.y > wall.p1.y && this.y < wall.p2.y) {
					let dx = Math.sign(this.x - wall.p1.x) * this.r
					this.x = wall.p1.x + dx;
					this.vel.x *= -friction;
				}
			}
			[wall.p1, wall.p2].some(p => {
				if (Math.hypot(this.x - p.x, this.y - p.y) < this.r) {
					let ax = this.x - p.x;
					let ay = this.y - p.y;
					let bx = this.vel.x;
					let by = this.vel.y;
					let f = - 2 * (ax * bx + ay * by) / (ax * ax + ay * ay);
					let al = Math.hypot(ax, ay);
					if (al !== 0) {
						this.x = p.x + (this.r * 1.01) * ax / al;
						this.y = p.y + (this.r * 1.01) * ay / al;
						this.vel.x = bx + f * ax;
						this.vel.y = by + f * ay;
						this.vel.x *= friction;
						this.vel.y *= friction;
					}
					if (Math.hypot(this.x - p.x, this.y - p.y) < this.r) {
						console.log('?????');
					}
					return true;
				}
			});
		});
		this.vel.x *= friction;
		this.vel.y *= friction;
		
		this.draw();
	}
	draw() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		ctx.fillStyle = this.color;
		ctx.fill();
	}
}

class Maze {
	constructor(width, height) {
		this.width = width;
		this.height = height;

		this.nodes = [];

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				this.nodes.push({ x: x, y: y });
			}
		}

		this.nodes.forEach(e => {
			e.neighbors = [
				{ pos: { x: e.x + 0, y: e.y - 1 }, dir: 'up' },
				{ pos: { x: e.x + 1, y: e.y + 0 }, dir: 'right' },
				{ pos: { x: e.x + 0, y: e.y + 1 }, dir: 'down' },
				{ pos: { x: e.x - 1, y: e.y + 0 }, dir: 'left' },
			].filter(n => n.pos.x >= 0 && n.pos.x < this.width && n.pos.y >= 0 && n.pos.y < this.height).map(n => {
				return {
					node: this.nodes.find(node => node.x == n.pos.x && node.y == n.pos.y),
					dir: n.dir
				}
			});
		});
		this.nodes.forEach(e => {
			if (e.x < this.width - 1) {
				e.pointer = e.neighbors.find(n => n.dir == 'right').node;
			}
			else if (e.y < this.height - 1) {
				e.pointer = e.neighbors.find(n => n.dir == 'down').node;
			}
			else this.origin = e;
		});

		while (!this.nodes.every(node => node.explored)) {
			this.step();
		}
		
		this.getWalls();
	}

	step() {
		this.origin.explored = true;
		this.origin.pointer = this.origin.neighbors[Math.floor(Math.random() * this.origin.neighbors.length)].node;
		this.origin = this.origin.pointer;
		this.origin.pointer = undefined;
	}

	draw(x, y, width, height) {
		this.nodes.forEach(node => {
			let px = (node.x + 0.5) * width / this.width + x;
			let py = (node.y + 0.5) * height / this.height + y;
			
			ctx.beginPath();
			ctx.arc(px, py, width / ((this.width - 1) * 2 * 3), 0, 2 * Math.PI);
			ctx.fillStyle = '#a0a0d0';
			ctx.fill();

			if (this.origin == node) {
				ctx.beginPath();
				ctx.arc(px, py, width / ((this.width - 1) * 2 * 4), 0, 2 * Math.PI);
				ctx.fillStyle = '#ff0000';
				ctx.fill();
			}
			if (node.pointer) {
				let x1 = (0.3 * node.x + 0.7 * node.pointer.x);
				let y1 = (0.3 * node.y + 0.7 * node.pointer.y);
				let p2x = (x1 + 0.5) * width / this.width + x;
				let p2y = (y1 + 0.5) * height / this.height + y;
				ctx.beginPath();
				ctx.moveTo(px, py);
				ctx.lineTo(p2x, p2y);
				ctx.lineWidth = width / ((this.width - 1) * 2 * 3 * 2);
				ctx.strokeStyle = '#a0a0d0';
				ctx.stroke();
			}
		});
	}

	drawWalls(x, y, width, height) {
		this.walls.forEach(wall => {
			ctx.beginPath();
			ctx.moveTo(wall.p1.x * width / this.width + x, wall.p1.y * height / this.height + y);
			ctx.lineTo(wall.p2.x * width / this.width + x, wall.p2.y * height / this.height + y);
			ctx.strokeStyle = '#906000';
			ctx.lineWidth = width / (this.width * 2 * 3 * 2);
			ctx.stroke();
		});
	}

	getWalls() {
		let walls_list = [];
		let wall = (node, dir) => {
			let x1 = node.x;
			let y1 = node.y;
			let x2 = node.x;
			let y2 = node.y;
			let orient;
			if (dir === 'left') {
				y2 = node.y + 1;
				orient = false;
			}
			else if (dir === 'up') {
				x2 = node.x + 1;
				orient = true;
			}
			else if (dir === 'right') {
				x1 = node.x + 1;
				x2 = node.x + 1;
				y2 = node.y + 1;
				orient = false;
			}
			else if (dir === 'down') {
				y1 = node.y + 1;
				y2 = node.y + 1;
				x2 = node.x + 1;
				orient = true;
			}
			else {
				console.log('error');
			}
			walls_list.push({
				p1: { x: x1, y: y1 },
				p2: { x: x2, y: y2 },
				orient: orient
			});
		}
		this.nodes.forEach(node => {
			if (node.x === 0) wall(node, 'left');
			if (node.y === 0) wall(node, 'up');
			if (node.x === this.width - 1) wall(node, 'right');
			if (node.y === this.height - 1) wall(node, 'down');
			node.neighbors.forEach(n => {
				if ((n.dir === 'right' || n.dir === 'down') && n.node.pointer !== node && node.pointer !== n.node) wall(node, n.dir);
			});
		});
		this.walls = walls_list;
	}
}

let maze = new Maze(12, 12);

new Ball((canvas.width / maze.width) / 2, (canvas.height / maze.height) / 2, 0.95 * Math.min(canvas.width / maze.width, canvas.height / maze.height) / 2);
//new Ball((canvas.width / maze.width) * (maze.width - 0.5), (canvas.height / maze.height) * (maze.height - 0.5), 0.95 * Math.min(canvas.width / maze.width, canvas.height / maze.height) / 2);
/*for (let i = 0; i < maze.width; i++) {
	for (let j = 0; j < maze.height; j++) {
		new Ball((canvas.width / maze.width) * (i + 0.5), (canvas.height / maze.height) * (j + 0.5), 0.95 * Math.min(canvas.width / maze.width, canvas.height / maze.height) / 2);
	}
}*/

let walls = maze.walls.map(wall => {
	return {
		p1: { x: wall.p1.x * canvas.width / maze.width, y: wall.p1.y * canvas.height / maze.height },
		p2: { x: wall.p2.x * canvas.width / maze.width, y: wall.p2.y * canvas.height / maze.height },
		orient: wall.orient
	}
});

function loop() {
	requestAnimationFrame(loop);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	Balls.forEach(ball => ball.loop());
	
	ctx.lineCap = 'round';
	walls.forEach(wall => {
		ctx.beginPath();
		ctx.moveTo(wall.p1.x, wall.p1.y);
		ctx.lineTo(wall.p2.x, wall.p2.y);
		ctx.strokeStyle = '#b07000';
		ctx.lineWidth = 3;
		ctx.stroke();
	});
}


if ('Accelerometer' in window) {
	var acl = new Accelerometer({ frequency: 60 });

	acl.addEventListener("reading", () => {
		/*console.log(`Acceleration along the X-axis: ${acl.x.toFixed(2)} m/s²`);
		console.log(`Acceleration along the Y-axis: ${acl.y.toFixed(2)} m/s²`);
		console.log(`Acceleration along the Z-axis: ${acl.z.toFixed(2)} m/s²`);*/
		
	});

	acl.addEventListener("error", (event) => {
		if (event.error.name === 'NotAllowedError') {
			console.error('Permission to access sensor was denied.');
		} else if (event.error.name === 'NotReadableError') {
			console.error('Cannot connect to the sensor.');
		}
	});

	acl.start();
} else {
	console.error('Accelerometer not supported in this browser.');
}