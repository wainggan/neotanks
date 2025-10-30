
class Entity {
	constructor(
		args: {
			id: number,
			object: typeof Entity,
			x: number,
			y: number,
		},
	) {
		this.id = args.id;
		this.object = args.object;
		this.x = args.x;
		this.y = args.y;
	}

	id: number;
	visible: boolean = true;
	persistent: boolean = false;
	depth: number = 0;
	object: typeof Entity;

	x: number;
	y: number;

	private destroy: boolean = false;
}

class Input {
	constructor(key: () => boolean) {
		this.key = key;
		this.time = 0;
	}

	key: () => boolean;
	time: number;

	update(): void {
		if (this.key()) {
			this.time += 1;
		} else if (this.time > 0) {
			this.time = -1;
		} else {
			this.time = Math.min(this.time + 1, 0);
		}
	}

	check(): boolean {
		return this.time > 0;
	}

	pressed(): boolean {
		return this.time == 1;
	}

	released(): boolean {
		return this.time == -1;
	}

	stutter(delay_initial: number, delay_interval: number): boolean {
		if (this.time == 1) {
			return true;
		}
		return this.time - delay_initial > 0 && (this.time - delay_initial) % delay_interval == 0;
	}
}

function get_methods(check: any) {
	const prop = [];
	let obj = check;

	do {
		prop.push(...Object.getOwnPropertyNames(obj));
	} while (obj = Object.getPrototypeOf(obj));

	return prop
		.sort()
		.filter((e, i, arr) => e != arr[i + 1] && typeof check[e] == 'function');
}

class Engine<const T extends readonly string[]> implements Public {
	constructor(events: T, canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const event_schedule: Partial<Engine<T>['event_schedule']> = {};
		for (const event of events) {
			event_schedule[event as T[number]] = 0;
		}

		this.event_schedule = event_schedule as Engine<T>['event_schedule'];
	}

	private uid: number = 0;

	private entities: Entity[] = [];
	private entities_type: Map<any, any> = new Map();

	private canvas: HTMLCanvasElement;

	private input_keys: Map<any, any> = new Map();
	private input_mouse: Map<any, any> = new Map();

	private transform: boolean = false;
	private transform_stack: (Engine<T>['transform'])[] = [];

	private inner_mouse_x: number = 0;
	private inner_mouse_y: number = 0;
	
	get mouse_x(): number {
		return this.inner_mouse_x;
	}
	get mouse_y(): number {
		return this.inner_mouse_y;
	}

	private inner_cam_x: number = 0;
	private inner_cam_y: number = 0;
	private inner_cam_zoom: number = 0;

	get cam_x(): number {
		return this.inner_cam_x;
	}
	set cam_x(x: number) {
		this.inner_cam_x = x;
	}
	get cam_y(): number {
		return this.inner_cam_y;
	}
	set cam_y(y: number) {
		this.inner_cam_y = y;
	}
	get cam_zoom(): number {
		return this.inner_cam_zoom;
	}
	set cam_zoom(zoom: number) {
		this.inner_cam_zoom = Math.max(zoom, 0);
	}

	cam_wts_x(x: number): number {
		return (x - this.inner_cam_x) * this.inner_cam_zoom;
	}
	cam_wts_y(y: number): number {
		return (y - this.inner_cam_y) * this.inner_cam_zoom;
	}
	cam_stw_x(x: number): number {
		return (x / this.inner_cam_zoom) - this.inner_cam_x;
	}
	cam_stw_y(y: number): number {
		return (y / this.inner_cam_zoom) - this.inner_cam_y;
	}

	private event_schedule: {
		[key in T[number]]: number;
	};

	entity_create(x: number, y: number, obj: typeof Entity, args: object): Entity {
		const inst = new obj({
			x,
			y,
			id: this.uid++,
			object: obj,
			...args,
		});

		const inst_methods = get_methods(inst);
		for (const method in inst_methods) {
			
		}
	}
};

const test = new Engine(['', ''], document.createElement('canvas'));

interface Public {
	get mouse_x(): number;
	get mouse_y(): number;

	get cam_x(): number;
	set cam_x(x: number);
	get cam_y(): number;
	set cam_y(y: number);
	get cam_zoom(): number;
	set cam_zoom(zoom: number);
	cam_wts_x(x: number): number;
	cam_wts_y(y: number): number;
	cam_stw_x(x: number): number;
	cam_stw_y(y: number): number;

	get time_current(): number;
	get time_fps(): number;
	get time_frame(): number;
	get time_delta(): number;
	time_set_delta_min(min: number): void;

	engine_update(): void;
	engine_purge_set_timer(time: number): void;
	engine_purge_enable(enable: boolean): void;
	engine_purge(): void;

	get window_width(): number;
	get window_height(): number;

	entity_create(x: number, y: number, obj: typeof Entity, arg: object): Entity;
	entity_refresh(inst: Entity): void;
	entity_destroy(type: typeof Entity): boolean;
	entity_exists(type: typeof Entity): boolean;
	entity_amount(type: typeof Entity): number;
	entity_get(type: typeof Entity): Entity | null;
	entity_list(type: typeof Entity): Entity[];
}

export function engine(canvas: HTMLCanvasElement) {
	
}


