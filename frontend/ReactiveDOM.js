///@ts-check

/**
 * @typedef {string | number | boolean | null | undefined} LiteralType 
 */

/**
 * @typedef {LiteralType | Array | Record<string, any>} ReactableType 
 */

/**
 * @typedef {LiteralType | RenderedDOM | Array} ProjectedType 
 */

// * @typedef {ReactiveProperty | ProjectedProperty | RenderedDOM | NodeReference} DOMProperty 
/**
 * @typedef {ReactiveProperty | RenderedDOM | NodeReference} DOMProperty 
 */

class RenderedDOM {
	/**
	 * Creates an instance of RenderedDOM.
	 * @param {ChildNode[]} nodes
	 * @param {Map<string, ReactiveNode | ReactiveAttribute>} props
	 * @memberof RenderedDOM
	 */
	constructor(nodes, props) {
		/** @type {ChildNode[]} */
		this.nodes = nodes;

		/** @type {Map<string, ReactiveNode | ReactiveAttribute>} */
		this.props = props;
	}

	/**
	 * @return {ChildNode[]} 
	 * @memberof RenderedDOM
	 */
	getAttachableNodes() {
		return this.nodes.map(e => RenderedDOM._getAttachableNode(e));
	}

	/**
	 * @return {ChildNode | null} 
	 * @memberof RenderedDOM
	 */
	getFirstAttachableNode() {
		const node = this.nodes[0];
		if(!node) return null;

		// return node.parentNode && node.ownerDocument && !node.ownerDocument["__isReactiveDOM__"] ? Component._cloneNode(node) : node;
		return RenderedDOM._getAttachableNode(node);
	}

	/** @type {Set<{nodes: Node[], callback: function}>} */
	static reactiveNodes = new Set();

	/**
	 * Registers a callback that is called when the node is unmounted from the DOM
	 * @static
	 * @param {Node[]} nodes
	 * @param {function(): void} callback
	 * @memberof RenderedDOM
	 */
	static registerNodeUnmountListener(nodes, callback) {
		this.reactiveNodes.add({
			nodes,
			callback
		});
	}

	/**
	 * @static
	 * @memberof RenderedDOM
	 */
	static _setupMutationObserver() {
		const observer = new MutationObserver(mutations => {
			for(const mutation of mutations) {
				if(mutation.type !== "childList") continue;
				if(!mutation.removedNodes.length) continue;

				for(const reactiveNode of this.reactiveNodes) {
					if(reactiveNode.nodes.some(e => e.isConnected)) continue;

					reactiveNode.callback();
					this.reactiveNodes.delete(reactiveNode);
				}
			}
		});

		observer.observe(document, {
			childList: true,
			subtree: true
		});
	}

	/**
	 * @static
	 * @template {Node} T
	 * @param {T} node
	 * @return {T} 
	 * @memberof RenderedDOM
	 */
	static _getAttachableNode(node) {
		// return node.parentNode && node.ownerDocument && !node.ownerDocument["__isReactiveDOM__"] ? Component._cloneNode(node) : node;

		const newNode = node.parentNode && node.ownerDocument && !node.ownerDocument["__isReactiveDOM__"] ? Component._cloneNode(node) : node;
		RenderedDOM._adoptNode(document, newNode);
		return newNode;
	}

	/**
	 * @static
	 * @param {Document} doc
	 * @param {Node} node
	 * @return {Node}
	 * @memberof RenderedDOM
	 */
	static _adoptNode(doc, node) {
		if(node.ownerDocument === doc) return node;
		return doc.adoptNode(node);
	}
}
RenderedDOM._setupMutationObserver();

class ReactiveAttribute {
	constructor(options = {}) {
		const {
			node,
			attr,
			strings,
			props
		} = options;

		/** @type {Node} */
		this.node = node;

		/** @type {Attr} */
		this.attr = attr;

		/** @type {Array<string>} */
		this.strings = strings;

		// /** @type {Array<ReactiveProperty | ProjectedProperty>} */
		/** @type {Array<ReactiveProperty>} */
		this.props = props;

		const registered = new Set();
		const callbacks = new Set();

		for(const prop of this.props) {
			if(prop instanceof ReactiveProperty /*|| prop instanceof ProjectedProperty*/) {
				if(registered.has(prop)) continue;

				const callback = prop.subscribe(value => {
					this.update();
				});

				registered.add(prop);
				callbacks.add({prop, callback});
			}
		}

		RenderedDOM.registerNodeUnmountListener([this.node], () => {
			for(const {prop, callback} of callbacks) {
				prop.unsubscribe(callback);
			}
		});
	}

	update() {
		let str = this.strings[0];

		for(let i = 0; i < this.props.length; i++) {
			const prop = this.props[i];
			const propValue = prop.valueOf();

			str += propValue + this.strings[i + 1];
		}

		this.attr.value = str;
		// this.node.setAttribute(this.attr.name, str);
	}
}

/**
 * @template {ReactableType} T
 * @class ReactiveNode
 */
class ReactiveNode {
	/**
	 * @typedef {Object} WatchItem
	 * @prop {ReactiveProperty<any>} prop
	 * @prop {(value: any) => void} listener
	 */

	/**
	 * Creates an instance of ReactiveNode.
	 * @param {*} [options={}]
	 * @memberof ReactiveNode
	 */
	constructor(options = {}) {
		const {
			nodes,
			parent,
			prop
		} = options;

		/** @type {Node[]} */
		this.nodes = nodes;

		/** @type {HTMLElement} */
		this.parent = parent;

		// /** @type {ReactiveProperty<T> | ProjectedProperty<T>} */
		/** @type {ReactiveProperty<T>} */
		this.prop = prop;

		/** @type {WatchItem[]} */
		this.watchList = [];

		/** @type {boolean} */
		this.isUpdating = false;

		// Build watch list
		this.buildWatchList(prop);

		// Register unmount listener
		RenderedDOM.registerNodeUnmountListener(this.nodes, () => {
			// console.log("unsubscribing", this, this.prop);
			if(this.isUpdating) return;

			for(const item of this.watchList) {
				item.prop.unsubscribe(item.listener);
			}
			this.watchList = [];
		});
	}

	/**
	 * @param {any} prop
	 * @return {WatchItem | null} 
	 * @memberof ReactiveNode
	 */
	buildWatchList(prop) {
		if(!(prop instanceof ReactiveProperty)) return null;

		let value = prop.value;
		let wasProp = value instanceof ReactiveProperty;

		const index = this.watchList.length;
		const listener = prop.subscribe(v => {
			const isProp = v instanceof ReactiveProperty;

			// Remove all items from the changed one
			if(wasProp && value !== v) {
				const removed = this.watchList.splice(index + 1, Infinity);
				for(const item of removed) {
					item.prop.unsubscribe(item.listener);
				}
			}

			// Rebuild the list based on the new value
			this.buildWatchList(v);

			this.update(this.watchList[this.watchList.length - 1].prop);

			value = v;
			wasProp = isProp;
		});

		this.watchList[index] = {
			prop,
			listener
		};

		this.buildWatchList(prop.value);

		return this.watchList[index];
	}

	/**
	 * @param {ReactiveProperty<T>} prop
	 * @memberof ReactiveNode
	 */
	update(prop) {
		// const propValue = this.prop.valueOf();
		const propValue = prop.valueOf();
		if(propValue === null) {
			console.warn("propValue is null", prop);
			return;
		}

		this.isUpdating = true;

		// Get the first node, which will be altered
		const firstNode = /**@type {HTMLElement}*/(this.nodes[0]);

		if(Array.isArray(propValue)) {
			const array = [];
			for(const item of propValue) {
				if(item instanceof RenderedDOM) {
					const nodes = item.getAttachableNodes();
					array.push(...nodes);
					continue;
				} else {
					const newNode = document.createTextNode(item + "");
					array.push(newNode);
				}
			}

			if(firstNode) {
				firstNode.replaceWith(...array);
				this.nodes.forEach(node => /**@type {HTMLElement}*/(node).remove());
			} else {
				this.parent.append(...array);
			}

			this.nodes = array;
		} else if(propValue instanceof Element) {
			const node = RenderedDOM._getAttachableNode(propValue);

			if(firstNode) {
				firstNode.replaceWith(node);
				this.nodes.forEach(node => /**@type {HTMLElement}*/(node).remove());
			} else {
				this.parent.append(node);
			}

			this.nodes = [node];
		} else if(propValue instanceof RenderedDOM) {
			const nodes = propValue.getAttachableNodes();

			if(firstNode) {
				firstNode.replaceWith(...nodes);
				this.nodes.forEach(node => /**@type {HTMLElement}*/(node).remove());
			} else {
				this.parent.append(...nodes);
			}

			this.nodes = nodes;
		} else {
			if(firstNode?.nodeType === Node.TEXT_NODE) {
				firstNode.textContent = propValue + "";

				if(this.nodes.length > 1) {
					this.nodes.forEach(node => /**@type {HTMLElement}*/(node).remove());
					this.nodes = [firstNode];
				}
			} else {
				const newNode = document.createTextNode(propValue + "");

				if(firstNode) {
					firstNode.replaceWith(newNode);
					this.nodes.forEach(node => /**@type {HTMLElement}*/(node).remove());
				} else {
					this.parent.append(newNode);
				}

				this.nodes = [newNode];
			}
		}

		setTimeout(() => {
			this.isUpdating = false;
		}, 0);
	}
}

/**
 * @param {TemplateStringsArray} strings
 * @param {Array<DOMProperty | Function | LiteralType | any>} args
 * @return {RenderedDOM} 
 */
const html = (strings, ...args) => {
	const doc = document.implementation.createHTMLDocument();
	doc["__isReactiveDOM__"] = true;

	/** @type {Object<string, DOMProperty | Function>} */
	const propsMap = {};

	// Loop the expressions and build the DOM with replacement placeholders
	for(let i = 0; i < strings.length; i++) {
		const str = strings[i];
		const arg = args[i];

		doc.write(str);

		if(i != strings.length - 1) {
			const rid = Math.random().toString(36).substring(2, 15);
			propsMap[rid] = arg;

			doc.write(`{{__${rid}__}}`);
		}
	}

	/** @type {Map<string, ReactiveNode | ReactiveAttribute>} */
	const nodesMap = new Map();

	const replacements = new Map();

	//walk the DOM
	const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ALL, null);

	let _node;
	while(_node = walker.nextNode()) {
		const type = _node.nodeType;

		if(type === Node.ELEMENT_NODE) {
			const node = /** @type {HTMLElement} */ (_node);
			const attrs = node.attributes;

			// Find reactive attributes
			let i = attrs.length;
			while(i--) {
				const attr = attrs[i];

				const name = attr.name;
				const value = attr.value;
				let newValue = value;

				const isListener = name.startsWith("on");
				const isPropAttr = name.startsWith("prop-");
				const isRef = name === "ref";
				let isDynamic = false;

				const strings = [];
				const props = [];
				let lastIndex = 0;

				let match;
				let count = 0;
				let hasAttribute = false;
				const regex = /\{\{__(.*?)__\}\}/g;
				while(match = regex.exec(newValue)) {
					const [m, rid] = match;

					const start = match.index;
					const end = start + m.length;

					const prop = propsMap[rid];

					if(isRef) {
						if(count > 0) throw new Error("Reference attribute can only contain one value");
						if(!(prop instanceof NodeReference)) throw new Error("Reference attribute must be instance of NodeReference");

						prop.node = node;

						node.removeAttribute(name);
						isDynamic = true;
					} else if(isPropAttr) {
						if(count > 0) throw new Error("Property attribute can only contain one value");

						const attrName = name.slice(5);
						if(attrName === "") throw new Error("Property attribute name cannot be empty");

						Component._setProp(node, attrName, prop);

						node.removeAttribute(name);
						isDynamic = true;
					} else if(isListener) {
						if(count > 0) throw new Error("Listener can only contain one handler");

						const eventName = name.slice(2);
						// if(typeof prop !== "function") throw new Error(`Expected function as '${eventName}' event handler, instead got '${typeof prop}'`);

						// Component._setListener(node, eventName, prop);
						// node.addEventListener(eventName, e => prop.call(node, e));
						// node.removeAttribute(name);
						// isDynamic = true;

						const setHandler = handler => {
							const existing = Component._getListener(node, eventName);
							if(existing) {
								node.removeEventListener(eventName, existing);
							}

							if(typeof handler === "function") {
								Component._setListener(node, eventName, handler);
								node.addEventListener(eventName, e => handler.call(node, e));
							} else {
								Component._setListener(node, eventName, null);
							}
						};

						if(prop instanceof ReactiveProperty) {
							prop.subscribe(value => setHandler(value));
						} else {
							if(typeof prop !== "function") throw new Error(`Expected function as '${eventName}' event handler, instead got '${typeof prop}'`);

							setHandler(prop);
						}

						node.removeAttribute(name);
						isDynamic = true;
					} else if(prop instanceof ReactiveProperty /*|| prop instanceof ProjectedProperty*/) {
						// nodesMap.set(rid, new ReactiveAttribute({
						// 	node,
						// 	attr,
						// 	prop,
						// 	range: [start, end]
						// }));

						const str = prop.valueOf() + "";

						strings.push(newValue.substring(lastIndex, start));
						props.push(prop);
						lastIndex = start + str.length;

						newValue = newValue.substring(0, start) + str + newValue.substring(end);
						regex.lastIndex = lastIndex;
						hasAttribute = true;
					} else {
						const str = prop + "";

						newValue = newValue.substring(0, start) + str + newValue.substring(end);
						regex.lastIndex = start + str.length;
						hasAttribute = true;
					}

					count++;
				}

				if(props.length > 0) {
					strings.push(newValue.substring(lastIndex));

					const reactiveAttr = new ReactiveAttribute({
						node,
						attr,
						strings,
						props
					});

					nodesMap.set(`attr-${attr.name}-${Math.random().toString(36).substring(2, 15)}`, reactiveAttr);
					Component._setAttribute(node, attr.name, reactiveAttr);
				}

				if(isPropAttr && !isDynamic) {
					Component._setProp(node, name.slice(5), newValue);
					node.removeAttribute(name);
					hasAttribute = false;
				} else if(isListener && !isDynamic) {
					throw new Error(`Expected function as '${name.slice(2)}' event handler, instead got '${typeof newValue}'`);
				}

				if(hasAttribute) {
					attr.value = newValue;
				}
			}
		} else if(_node.nodeType === Node.TEXT_NODE) {
			const node = /** @type {Text} */ (_node);

			let match;
			const regex = /\{\{__(.*?)__\}\}/g;

			const content = node.textContent || "";
			const textNodes = [];
			let lastIndex = 0;

			while(match = regex.exec(content)) {
				const [m, rid] = match;

				const start = match.index;
				const end = start + m.length;

				textNodes.push({
					literal: content.substring(lastIndex, start)
				});
				lastIndex = end;

				const prop = propsMap[rid];

				if(typeof prop === "function") {
					throw new Error("Functions are not supported in text nodes");
				}

				textNodes.push({
					prop,
					range: [start, end]
				});
			}

			textNodes.push({
				literal: content.substring(lastIndex)
			});

			replacements.set(node, textNodes);
		}
	}

	for(const [node, textNodes] of replacements) {
		const nodes = [];

		for(const obj of textNodes) {
			const {literal, prop} = obj;
			if("literal" in obj) {
				nodes.push(document.createTextNode(literal));
			} else {
				const _nodes = constructNodes(prop)
					.map(e => e.parentNode && !e.parentNode["__isReactiveDOM__"] ? Component._cloneNode(e) : e);
				nodes.push(..._nodes);

				if(prop instanceof ReactiveProperty /*|| prop instanceof ProjectedProperty*/) {
					nodesMap.set(Math.random().toString(36).substring(2, 15), new ReactiveNode({
						nodes: _nodes,
						parent: node.parentNode,
						prop: prop
					}));
				}
			}
		}

		node.replaceWith(...nodes);
	}

	return new RenderedDOM([...doc.body.childNodes], nodesMap);
};

/**
 *
 * @param {DOMProperty | LiteralType | Array<DOMProperty | string | Array>} rendered
 * @return {Node[]} 
 */
const constructNodes = (rendered) => {
	// if(rendered instanceof ProjectedProperty) return constructNodes(rendered.project());
	if(rendered instanceof ReactiveProperty) return constructNodes(rendered.value);
	if(rendered instanceof RenderedDOM) return rendered.getAttachableNodes();
	if(rendered instanceof HTMLElement) return [rendered];

	if(Array.isArray(rendered)) return rendered.flatMap(constructNodes);

	return [document.createTextNode(rendered + "")];
};

/**
 * @template T
 * @class ReactiveProperty
 */
class ReactiveProperty {
	/**
	 * Creates an instance of ReactiveProperty.
	 * @param {T} value
	 * @memberof ReactiveProperty
	 */
	constructor(value) {
		/**
		 * @private
		 * @type {T}
		 */
		this._value = value;

		/** @type {Set<(value: any) => void> | null} */
		this.subscribers = null;
	}

	/**
	 * Sets the value of the property and updates all subscribers
	 * @param {T} value
	 * @memberof ReactiveProperty
	 */
	set value(value) {
		this._value = value;
		this.update();
	}

	/**
	 * Returns the value of the property
	 * @returns {T}
	 * @memberof ReactiveProperty
	 */
	get value() {
		return this._value;
	}

	/**
	 * Updates all subscribers
	 * @memberof ReactiveProperty
	 */
	update() {
		if(!this.subscribers) return;

		for(const callback of this.subscribers) {
			callback(this._value);
		}
	}

	// eslint-disable-next-line valid-jsdoc
	/**
	 * Registers a subscriber callback
	 * @template {(value: T) => void} U
	 * @param {U} callback
	 * @returns {U}
	 * @memberof ReactiveProperty
	 */
	subscribe(callback) {
		if(!this.subscribers) this.subscribers = new Set();
		this.subscribers.add(callback);
		return callback;
	}

	// eslint-disable-next-line valid-jsdoc
	/**
	 * Registers a subscriber callback
	 * @param {(value: T) => void} callback
	 * @returns {void}
	 * @memberof ReactiveProperty
	 */
	unsubscribe(callback) {
		if(!this.subscribers) return;
		this.subscribers.delete(callback);
	}

	//  * @template {ProjectedType} U
	// eslint-disable-next-line valid-jsdoc
	/**
	 * Maps the property value to a new value
	 * @template U
	 * @template V
	 * @param {(value: T) => U} func
	 * @param {V} [defaultValue]
	 * @return {ReactiveProperty<U extends Promise ? Awaited<U> | V : U>} 
	 * @memberof ReactiveProperty
	 */
	as(func, defaultValue) {
		// return new ProjectedProperty(this, func);

		// const prop = new ReactiveProperty(func(this.value));
		// this.subscribe(value => prop.value = func(this.value));
		// return prop;

		const value = func(this.value);
		let prop = null;

		if(value instanceof Promise) {
			prop = new ReactiveProperty(defaultValue);
			value.then(value => prop.value = value);
		} else {
			prop = new ReactiveProperty(value);
		}

		this.subscribe(async value => prop.value = await func(this.value));

		// @ts-ignore
		return prop;
	}

	/**
	 * @return {T}
	 * @memberof ReactiveProperty
	 */
	valueOf() {
		return this.value;
	}

	/**
	 * @template T
	 * @static
	 * @param {Prop<T>} prop
	 * @returns {ReactiveProperty<T>}
	 * @memberof ReactiveProperty
	 */
	static from(prop) {
		if(prop instanceof ReactiveProperty) return prop;
		return new ReactiveProperty(prop);
	}
}

/**
 * @template T
 * @template U
 * @typedef {Object} ProjectableProperty
 * @prop {T} value
 * @prop {(cb: (v: T) => U) => (Prop<U> | ReactiveProperty<U>)} as 
 */

// eslint-disable-next-line valid-jsdoc
/**
 * @template T
 * @template U
 * @param {Prop<T>} prop
 * @return {ProjectableProperty<T, U>} 
 */
function RP(prop) {
	if(prop instanceof ReactiveProperty) return prop;
	return {
		value: prop,
		as: cb => cb(prop)
	};
}

/**
 * @template {Element} T
 * @class NodeReference
 */
class NodeReference {
	/** @type {T} */
	node;
}

/**
 * @template T
 * @typedef { T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T} WidenLiteral 
 */

/**
 * @template T
 * @typedef {ReactiveProperty<T> | T} Prop 
 */

/**
 * @typedef {Object} ComponentMetaOptions
 * @prop {NodeReference} [$ref] 
 * @prop {Record<string, string>} [$attrs] 
 */

/**
 * @typedef {Record<string, any>} ComponentProperties
 * @typedef {ComponentMetaOptions & ComponentProperties} ComponentOptions
 */

/**
 * @class Component
 * @extends {HTMLElement}
 */
class Component extends HTMLElement {
	static tagName = "custom-component";

	/** @type {boolean} */
	prerender = false;

	/** @type {boolean} */
	isRendered = false;

	/**
	 * Creates an instance of Component.
	 * @param {ComponentOptions} [options]
	 * @memberof Component
	 */
	constructor(options = {}) {
		super();

		this.isRendered = false;

		// if(arguments.length === 0) throw new Error("Component constructor must have a single parameter with default value '{}'");
		// if(typeof options === "undefined") throw new Error("Component constructor must pass first parameter to super constructor");
		// if(!options || typeof options !== "object") throw new Error(`Component constructor must pass non-null object to super constructor (got '${typeof options}')`);
		if(!options || typeof options !== "object") throw new Error("Component options must be an object");

		if("$ref" in options) {
			if(!(options.$ref instanceof NodeReference)) throw new Error("Reference must be instance of 'NodeReference'");
			options.$ref.node = this;
			// delete options.$ref;
		}

		if("$attrs" in options) {
			if(!options.$attrs || typeof options.$attrs !== "object") throw new Error("Attributes must be an object");

			for(const name in options.$attrs) {
				this.setAttribute(name, options.$attrs[name]);
			}

			// delete options.$attrs;
		}

		// Copy props from parsed html into constructor options
		const propData = this["__properties_data__"];
		if(propData) {
			for(const name in propData) {
				options[name] = propData[name];
			}
		} else {
			for(const attr of this.attributes) {
				if(!attr.name.startsWith("prop-")) continue;
				options[attr.name] = attr.value;
			}
		}

		this.prerender = !!options.prerender;
		this._initData = options;

		// Promise.resolve().then(() => this.init(options));
	}

	_initData = {};
	_isInitiated = false;

	_init(options) {
		if(this._isInitiated) return;
		this._isInitiated = true;
		this.init(options || {});
	}

	/**
	 * @param {unknown} options
	 * @memberof Component
	 */
	init(options) { }

	// eslint-disable-next-line valid-jsdoc
	/**
	 * @template {Component} T
	 * @this {new (options: ComponentOptions & Parameters<T["init"]>[0]) => T}
	 * @static
	 * @param {ComponentOptions & Parameters<T["init"]>[0]} [options]
	 * @returns {T}
	 * @memberof Component
	 */
	static new(options = {}) {
		// @ts-ignore
		if(!this.registeredElements.has(this.tagName)) throw new Error(`Component with the name '${this.tagName}' is not registered. Did you forget 'Component.register(${this.name});'?`);
		return new this(options);
	}

	connectedCallback() {
		// Only allow rendering if it is attached to the main document
		if(!this.prerender && this.ownerDocument !== window.document) return;

		// Only render if it hasn't been rendered yet
		if(this.isRendered) return;
		this.isRendered = true;

		this._init(this._initData);

		// Render the component
		const rendered = this.render();

		// Check for returned nodes
		const component = rendered.nodes[0]; // Safe to use nodes directly, since the node is bound to this instance
		if(!component) throw new Error("No component found");

		// Set the attributes
		// @ts-ignore
		for(const attr of component.attributes || []) {
			if(!attr.specified) continue;
			if(this.hasAttribute(attr.name)) continue;
			this.setAttribute(attr.name, attr.value);
		}

		// Add listeners
		const listeners = component["__listeners__"];
		if(listeners) {
			for(const name in listeners) {
				if(!listeners[name]) continue;
				this.addEventListener(name, listeners[name].bind(this));
			}
		}

		// Add reactive attributes
		const attributes = /**@type {Record<string, ReactiveAttribute>}*/(component["__attributes__"]);
		if(attributes) {
			for(const name in attributes) {
				const reactiveAttr = attributes[name];
				if(!reactiveAttr) continue;

				reactiveAttr.node = this;

				const attr = this.attributes[name];
				if(attr) {
					reactiveAttr.attr = attr;
				} else {
					this.setAttribute(name, "");
					reactiveAttr.attr = this.attributes[name];
					reactiveAttr.update();
				}
			}
		}

		// Append the child nodes and call the onMount method
		this.append(...component.childNodes);
		this.onMount();

		// Only register the unmount listener if the onUnmount method is overridden
		// (might not be the best practice, but it boosts performance)
		if(this.onUnmount !== Component.prototype.onUnmount) {
			RenderedDOM.registerNodeUnmountListener([this], () => {
				this.onUnmount();
			});
		}
	}

	onMount() { }

	onUnmount() { }

	query(selector) {
		return this.querySelector(selector);
	}

	queryAll(selector) {
		return this.querySelectorAll(selector);
	}

	render() {
		return html`<${Component.tagName}>Instance of the "${Component.tagName}" element!</${Component.tagName}>`;
	}

	/**
	 * @param {function(any): void} callback
	 * @param {ReactiveProperty[]} props
	 * @memberof Component
	 */
	subscribeTo(callback, props) {
		const callbacks = new Set();

		for(const prop of props) {
			const cb = prop.subscribe(value => {
				callback(value);
			});

			callbacks.add({prop, callback: cb});
		}

		RenderedDOM.registerNodeUnmountListener([this], () => {
			for(const {prop, callback} of callbacks) {
				prop.unsubscribe(callback);
			}
		});
	}

	static registeredElements = new Map();

	// eslint-disable-next-line valid-jsdoc
	/**
	 * Registers the component with the browser
	 * @static
	 * @param {typeof Component} component
	 * @memberof Component
	 */
	static register(component) {
		const name = component.tagName;

		if(this.registeredElements.has(name)) throw new Error(`Component with the name '${name}' is already registered`);

		customElements.define(name, component);
		this.registeredElements.set(name, component);
	}

	static _cloneNode(node) {
		// Clone the node
		const clone = node.cloneNode(false);

		// Clone child nodes recursively
		for(const originalChild of node.childNodes) {
			if(originalChild.nodeType === 1) { // 1: ELEMENT_NODE
				const clonedChild = this._cloneNode(originalChild);
				clone.appendChild(clonedChild);
			} else if(originalChild.nodeType === 3) { // 3: TEXT_NODE
				const textNode = document.createTextNode(originalChild.nodeValue);
				clone.appendChild(textNode);
			}
		}

		// Clone custom attributes
		clone["__properties_data__"] = node["__properties_data__"];
		clone["__listeners__"] = node["__listeners__"];

		for(const event in node["__listeners__"]) {
			clone.addEventListener(event, node["__listeners__"][event]);
		}

		return clone;
	}

	static _setProp(node, name, value) {
		if(!node["__properties_data__"]) node["__properties_data__"] = {};
		node["__properties_data__"][name] = value;
	}

	static _setAttribute(node, name, value) {
		if(!node["__attributes__"]) node["__attributes__"] = {};
		node["__attributes__"][name] = value;
	}

	static _setListener(node, name, value) {
		if(!node["__listeners__"]) node["__listeners__"] = {};
		if(value) node["__listeners__"][name] = value;
		else if(node["__listeners__"][name]) delete node["__listeners__"][name];
	}

	static _getListener(node, name) {
		if(!node["__listeners__"]) return null;
		return node["__listeners__"][name] || null;
	}
}

/**
 * @template T
 * @class ItemListComponent
 * @extends {Component}
 */
class ItemListComponent extends Component {
	static tagName = "item-list";

	/** @type {T[]} */
	items = [];

	onChange = new ReactiveProperty(null);

	/** @type {(item: T) => Node} */
	_createItem;

	// eslint-disable-next-line valid-jsdoc
	/**
	 * Creates an instance of ItemListComponent.
	 * @param {{item: (item: T, instance: ItemListComponent) => (RenderedDOM | Node), items: T[]}} options
	 * @memberof ItemListComponent
	 */
	init({item, items}) {
		if(typeof item !== "function") throw new Error(`'attr-item' attribute must be a 'function', instead got '${typeof this._createItem}'`);

		this._createItem = _item => {
			// Render the item
			const rendered = item(_item, this);

			// The Node returned => basic HTML element
			if(rendered instanceof Node) return rendered;

			// The RenderedDOM => dynamic HTML element
			const node = rendered.getFirstAttachableNode();
			if(!node) throw new Error(`[ItemListComponent] 'item' function must return a 'RenderedDOM' or 'Component' instance`);

			return node;
		};

		if(items) {
			if(!Array.isArray(items)) throw new Error(`'attr-items' attribute must be an 'array', instead got '${typeof items}'`);
			this.setItems(items);
		}
	}

	/* List manipulation methods */

	/**
	 * @param {T[]} items
	 * @memberof ListComponent
	 */
	setItems(items) {
		this.items = items;
		this.replaceChildren(...this.items.map(this._createItem));
		this.onChange.update();
	}

	/**
	 * @param {T} item
	 * @memberof ListComponent
	 */
	unshiftItem(item) {
		this.items.unshift(item);
		this.insertBefore(this._createItem(item), this.firstChild);
		this.onChange.update();
	}

	/**
	 * @param {T} item
	 * @memberof ListComponent
	 */
	pushItem(item) {
		this.items.push(item);
		this.appendChild(this._createItem(item));
		this.onChange.update();
	}

	/**
	 * @param {number} index
	 * @param {T} item
	 * @memberof ListComponent
	 */
	insertItem(index, item) {
		this.items.splice(index, 0, item);
		this.insertBefore(this._createItem(item), this.children[index]);
		this.onChange.update();
	}

	/**
	 * @param {T} item
	 * @memberof ListComponent
	 */
	deleteItem(item) {
		const index = this.items.indexOf(item);
		if(index < 0) return;

		this.items.splice(index, 1);
		this.removeChild(this.children[index]);
		this.onChange.update();
	}

	/**
	 * @param {number} index
	 * @memberof ListComponent
	 */
	deleteItemAt(index) {
		if(index < 0 || index >= this.items.length) return;
		this.items.splice(index, 1);
		this.removeChild(this.children[index]);
		this.onChange.update();
	}

	/**
	 * @param {number} start
	 * @param {number} deleteCount
	 * @param {T[]} items
	 * @memberof ItemListComponent
	 */
	spliceItems(start, deleteCount, ...items) {
		// Remove the items from the list
		const removedItems = this.items.splice(start, deleteCount, ...items);

		// Create a set of removed items
		const set = new Set(removedItems);

		// Create a map of removed items => nodes
		const map = new Map();
		for(let i = 0; i < removedItems.length; i++) {
			const child = this.children[start + i];
			map.set(removedItems[i], child);
		}

		// Remove the nodes that are not in the list
		for(const item of map.keys()) {
			if(set.has(item)) continue;
			map.get(item).remove();
		}

		// Create the new nodes or reuse the old ones
		const nodes = items.map(e => map.get(e) || this._createItem(e));

		// Depending on the start index, append or insert the nodes
		if(start <= 0) {
			this.prepend(...nodes);
		} else if(start >= this.items.length) {
			this.append(...nodes);
		} else {
			for(let i = 0; i < nodes.length; i++) {
				this.insertBefore(nodes[i], this.children[start + i]);
			}
		}

		this.onChange.update();
	}

	/* Utility methods */

	get length() {
		return this.items.length;
	}

	/**
	 * @param {T} item
	 * @return {number} 
	 * @memberof ItemListComponent
	 */
	indexOf(item) {
		return this.items.indexOf(item);
	}

	/**
	 * @param {number} relativeIndex
	 * @return {T | undefined} 
	 * @memberof ItemListComponent
	 */
	at(relativeIndex) {
		return this.items[relativeIndex < 0 ? this.items.length + relativeIndex : relativeIndex];
	}

	/**
	 * @param {T} item
	 * @return {boolean} 
	 * @memberof ItemListComponent
	 */
	isFirst(item) {
		return this.items[0] === item;
	}

	/**
	 * @param {T} item
	 * @return {boolean} 
	 * @memberof ItemListComponent
	 */
	isLast(item) {
		return this.items[this.items.length - 1] === item;
	}

	/**
	 * @return {ArrayIterator<[number, T]>} 
	 * @memberof ItemListComponent
	 */
	entries() {
		return this.items.entries();
	}

	/**
	 * @return {ArrayIterator<T>} 
	 * @memberof ItemListComponent
	 */
	[Symbol.iterator]() {
		return this.items[Symbol.iterator]();
	}

	render() {
		return html`<item-list></item-list>`;
	}
}
Component.register(ItemListComponent);

if(window["__ts-check__"]) {
	module.exports = {
		ReactiveProperty,
		NodeReference,
		RenderedDOM,
		Component,
		ItemListComponent,
		html,
		RP
	};
}