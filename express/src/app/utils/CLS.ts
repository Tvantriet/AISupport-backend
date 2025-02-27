// eslint-disable-next-line @typescript-eslint/no-var-requires
import hooks from "async_hooks";
const cls: any = {};
let current: any = {};
const HOLD: any = "$HOLD";

hooks
	.createHook({
		init(asyncId: any, type: any, triggerId: any) {
			const existing = cls[triggerId] || {};
			cls[asyncId] = existing[HOLD] ? existing : { ...existing, _parent: existing };
		},
		before(id: any) {
			current = cls[id] = cls[id] || {};
		},
		after() {
			current = null;
		},
		destroy(id: any) {
			delete cls[id];
		},
	})
	.enable();

function getCurrent() {
	return current;
}

const r: any = new Proxy(getCurrent, {
	get(obj: any, prop: any) {
		if (prop === "$hold")
			return function (hold: any) {
				current[HOLD] = !!hold;
			};
		if (prop === "$init")
			return function (fn: any) {
				current && (current[HOLD] = true);
				if (fn) {
					return function (...params: any) {
						current && (current[HOLD] = true);
						return fn(...params);
					};
				}
			};
		if (current) {
			return current[prop];
		}
	},
	set(obj, prop, value) {
		if (current) {
			current[prop] = value;
			return true;
		} else {
			return false;
		}
	},
	has(obj, prop) {
		return prop in current;
	},
});

export default r;
