// @ts-check

if(window["__ts-check__"]) {
	const {html, Component, ReactiveProperty, RP, NodeReference, RenderedDOM, ItemListComponent} = require("./ReactiveDOM.js");
}

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

const map = (value, inMin, inMax, outMin, outMax) => (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

// View Transition API polyfill
document.startViewTransition = document.startViewTransition || (callback => callback && callback());

/** @import {Prop} from "./ReactiveDOM.js" */

class DisplayPreview extends Component {
	static tagName = "display-preview";

	static WIDTH = 5;
	static HEIGHT = 5;

	enableSelect = false;

	displayValues = Array.from({length: DisplayPreview.WIDTH * DisplayPreview.HEIGHT}, () => new ReactiveProperty(false));
	updateTrigger = new ReactiveProperty(0);

	/**
	 * @param {{enableSelect?: boolean}} options
	 * @memberof DisplayPreview
	 */
	async init({enableSelect = false}) {
		this.enableSelect = enableSelect;

		// Hook up the update trigger
		this.displayValues.forEach((v, i) => v.subscribe(() => this.updateTrigger.value = i));
	}

	onMount() { }

	/**
	 * @param {HTMLElement} led
	 * @param {ReactiveProperty<boolean>} value
	 * @memberof DisplayPreview
	 */
	onClick(led, value) {
		if(!this.enableSelect) return;

		value.value = !value.value;
	}

	/**
	 * @param {number} index
	 * @returns {boolean}
	 * @memberof DisplayPreview
	 */
	getValue(index) {
		return this.displayValues[index].value;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 * @memberof DisplayPreview
	 */
	getValueAt(x, y) {
		return this.displayValues[x + y * DisplayPreview.WIDTH].value;
	}

	/**
	 * @param {number} index
	 * @param {boolean} value
	 * @memberof DisplayPreview
	 */
	setValue(index, value) {
		this.displayValues[index].value = value;
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} value
	 * @memberof DisplayPreview
	 */
	setValueAt(x, y, value) {
		this.displayValues[x + y * DisplayPreview.WIDTH].value = value;
	}

	clearValues() {
		this.displayValues.forEach(v => v.value = false);
	}

	/**
	 * @param {DisplayPreview} display
	 * @memberof DisplayPreview
	 */
	copyValues(display) {
		this.displayValues.forEach((v, i) => v.value = display.displayValues[i].value);
	}

	/**
	 * @return {Uint8Array} 
	 * @memberof DisplayPreview
	 */
	encode() {
		const bytes = new Uint8Array(5);
		for(let y = 0; y < 5; y++) {
			for(let x = 0; x < 5; x++) {
				bytes[y] |= (this.getValueAt(x, y) ? 1 : 0) << x;
			}
		}
		return bytes;
	}

	static indexToCoords(index) {
		return [index % DisplayPreview.WIDTH, Math.floor(index / DisplayPreview.WIDTH)];
	}

	render() {
		return html`<display-preview>
			${this.displayValues.map((v, i) => html`<div
				class="led ${v.as(v => v ? "on" : "")}"
				onclick="${e => this.onClick(e.target, v)}"
			></div>`)}
		</display-preview>`;
	}
}
Component.register(DisplayPreview);

class DisplayMode extends Component {
	pageTitle = "Display Mode";
	isActive = false;

	onActivate() { }
	onDeactivate() { }
}

class ModeSelect extends Component {
	static tagName = "mode-select";

	/** @type {DisplayMode[]} */
	pages = [];

	/** @type {ReactiveProperty<DisplayMode | null>} */
	currentPage = new ReactiveProperty(null);

	/**
	 * @param {{pages?: DisplayMode[]}} options
	 * @memberof DisplayPreview
	 */
	async init({pages = []}) {
		this.pages = pages;

		this.currentPage.subscribe(page => {
			if(!page) return;

			page.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
		});

		this.selectPage(this.pages[0] || null);
	}

	/**
	 * @param {DisplayMode} page
	 * @memberof ModeSelect
	 */
	selectPage(page) {
		if(this.currentPage.value) {
			this.currentPage.value.isActive = false;
			this.currentPage.value.onDeactivate();
		}

		this.currentPage.value = page;

		if(page) {
			page.isActive = true;

			// Delay the activation to the next tick
			setTimeout(() => page.onActivate(), 0);
		}
	}

	onMount() { }

	render() {
		return html`<mode-select>
			<div class="headings">
				${this.pages.map(page => html`<div
					class="heading ${this.currentPage.as(v => v === page ? "active" : "")}"
					onclick="${() => this.selectPage(page)}"
				>${page.pageTitle}</div>`)}
			</div>
			<div class="modes">${this.pages}</div>
		</mode-select>`;
	}
}
Component.register(ModeSelect);

class SliderInput extends Component {
	static tagName = "slider-input";

	id = Math.random().toString(36).slice(2);

	/** @type {ReactiveProperty<number>} */
	value = new ReactiveProperty(0);

	/** @type {ReactiveProperty<number>} */
	min = new ReactiveProperty(0);

	/** @type {ReactiveProperty<number>} */
	max = new ReactiveProperty(100);

	/** @type {ReactiveProperty<number>} */
	step = new ReactiveProperty(1);

	/** @type {ReactiveProperty<number>} */
	precision = new ReactiveProperty(1);

	/** @type {ReactiveProperty<number[]>} */
	values = new ReactiveProperty([]);

	input = /** @type {NodeReference<HTMLInputElement>} */(new NodeReference());

	/**
	 * @param {{value?: number, min?: number, max?: number, step?: number, precision?: number, values?: number[]}} options
	 * @memberof SliderInput
	 */
	init({min = 0, max = 100, value = (min + max) * 0.5, step = 1, precision = -1, values = []}) {
		this.value.value = value;
		this.min.value = min;
		this.max.value = max;
		this.step.value = step;
		this.values.value = values;

		if(precision < 0) {
			this.precision = this.step.as(v => v.toString().split(".")[1]?.length || 0);
		} else {
			this.precision.value = precision;
		}

		this.value.subscribe(v => {
			this.input.node.value = v + "";
		});
	}

	onMount() {
		this.input.node.value = this.value.value + "";
	}

	render() {
		return html`<slider-input>
			<input
				ref="${this.input}"
				type="range"
				min="${this.min}"
				max="${this.max}"
				step="${this.step}"
				value="${this.value.value}"
				list="${this.id}-values"
				oninput="${e => this.value.value = e.target.valueAsNumber}"
			>
			<datalist id="${this.id}-values">
				${this.values.as(a => a.map(v => html`<option value="${v}">`))}
			</datalist>
			<span class="value">${this.value.as(v => v.toFixed(this.precision.value))}</span>
		</slider-input>`;
	}
}
Component.register(SliderInput);

class TextDisplayMode extends DisplayMode {
	static tagName = "text-display-mode";

	pageTitle = "Text";

	/** @type {ReactiveProperty<string>} */
	text = new ReactiveProperty("");

	speedSlider = SliderInput.new({
		min: 50,
		max: 500,
		step: (500 - 50) / 255,
		precision: 0,
		values: [75, 100, 150, 200, 250, 300, 400]
	});

	/** @type {DisplayPreview} */
	display;

	/**
	 * @param {{display: DisplayPreview}} options
	 * @memberof TextDisplayMode
	 */
	init({display}) {
		this.display = display;
	}

	onActivate() {
		this.display.enableSelect = false;
		this.display.clearValues();
	}

	async onDisplay() {
		const text = this.text.value;
		const speed = this.speedSlider.value.value;

		const buffer = new Uint8Array(1 + text.length);
		buffer[0] = Math.round(map(speed, this.speedSlider.min.value, this.speedSlider.max.value, 0, 255));
		for(let i = 0; i < text.length; i++) {
			buffer[i + 1] = text.charCodeAt(i);
		}

		await API.post("/text", buffer);
	}

	render() {
		return html`<text-display-mode>
			<div class="option">
				<label>Text to display</label>
				<input
					type="text"
					placeholder="e.g. Hello World!"
					value="${this.text}"
					oninput="${e => this.text.value = e.target.value}"
				>
			</div>
			<div class="option">
				<label>Speed</label>
				${this.speedSlider}
			</div>
			<div class="actions">
				<button
					class="button primary"
					onclick="${() => this.onDisplay()}"
				>Display</button>
			</div>
		</text-display-mode>`;
	}
}
Component.register(TextDisplayMode);

class PatternDisplayMode extends DisplayMode {
	static tagName = "pattern-display-mode";

	pageTitle = "Pattern";

	isRunning = new ReactiveProperty(false);

	submitButton = /** @type {NodeReference<HTMLButtonElement>} */(new NodeReference());

	/** @type {DisplayPreview} */
	display;

	pattern = DisplayPreview.new({enableSelect: false});

	/**
	 * @param {{display: DisplayPreview}} options
	 * @memberof PatternDisplayMode
	 */
	init({display}) {
		this.display = display;

		this.display.updateTrigger.subscribe(async i => {
			if(!this.isActive) return;

			const value = this.display.getValue(i);
			this.pattern.setValue(i, value);

			// When the a single LED is changed and the custom mode is running,
			// we can just send a notify about the change without sending the whole pattern
			if(this.isRunning.value) {
				const buffer = new Uint8Array(2);

				const [x, y] = DisplayPreview.indexToCoords(i);
				buffer[0] = ((y & 0xF) << 4) | x & 0xF;
				buffer[1] = value ? 0x1 : 0x0;

				await API.post("/custom/led", buffer);
			}
		});

		this.isRunning.subscribe(async v => {
			if(v) {
				// When enabling custom mode, we can provide the data right away,
				// without explicitly enabling it to save an extra request
				await API.post("/custom/pattern", this.pattern.encode());
			} else {
				// When disabling custom mode, we just disable it
				await API.post("/custom/disable");
			}
		});
	}

	async onActivate() {
		this.display.enableSelect = true;
		this.display.copyValues(this.pattern);
	}

	async onDeactivate() {
		if(this.isRunning.value) {
			this.isRunning.value = false;
		}
	}

	async onToggle() {
		if(this.isRunning.value) {
			this.isRunning.value = false;
		} else {
			this.display.copyValues(this.pattern);
			this.isRunning.value = true;
		}
	}

	render() {
		return html`<pattern-display-mode>
			<div class="actions">
				<button
					ref="${this.submitButton}"
					class="button ${this.isRunning.as(v => v ? "secondary" : "primary")}"
					onclick="${() => this.onToggle()}"
				>${this.isRunning.as(v => v ? "Stop" : "Start")}</button>
			</div>
		</pattern-display-mode>`;
	}
}
Component.register(PatternDisplayMode);

const SVG = {
	TIMES_CIRCLE: html`<svg viewBox="0 0 512 512"><path fill="currentColor" d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"></svg>`,
	CARET_LEFT: html`<svg viewBox="0 0 256 512"><path fill="currentColor" d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z"></svg>`,
	CARET_RIGHT: html`<svg viewBox="0 0 256 512"><path fill="currentColor" d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z"></svg>`,
	PLUS: html`<svg viewBox="0 0 448 512"><path fill="currentColor" d="M248 72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 160L40 232c-13.3 0-24 10.7-24 24s10.7 24 24 24l160 0 0 160c0 13.3 10.7 24 24 24s24-10.7 24-24l0-160 160 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-160 0 0-160z"></svg>`,
};

class SequenceDisplayMode extends DisplayMode {
	static tagName = "sequence-display-mode";

	pageTitle = "Sequence";

	/** @type {ReactiveProperty<string>} */
	text = new ReactiveProperty("");

	/** @type {ReactiveProperty<number>} */
	speed = new ReactiveProperty(1);

	framesContainer = /** @type {NodeReference<HTMLDivElement>} */(new NodeReference());
	submitButton = /** @type {NodeReference<HTMLButtonElement>} */(new NodeReference());

	/** @type {DisplayPreview} */
	display;

	/**
	 * @typedef {Object} FrameItem
	 * @prop {DisplayPreview} preview 
	 * @prop {ReactiveProperty<number>} duration 
	 */

	/** @type {ReactiveProperty<FrameItem | null>} */
	currentlyEditing = new ReactiveProperty(null);

	speedSlider = SliderInput.new({
		min: 0.16,
		max: 5,
		step: (5 - 0.16) / 255,
		precision: 2,
		values: [0.33, 0.5, 1, 2]
	});

	repeatSlider = SliderInput.new({
		min: 1,
		max: 255,
		step: 1,
		values: [2, 5, 10, 25, 50, 100, 200]
	});

	/** @type {ReactiveProperty<ReturnType<SequenceDisplayMode["startPreview"]> | null>} */
	runningPreview = new ReactiveProperty(null);

	/**
	 * @param {{display: DisplayPreview}} options
	 * @memberof SequenceDisplayMode
	 */
	init({display}) {
		this.display = display;

		this.currentlyEditing.subscribe(v => {
			this.display.enableSelect = !!v;

			if(!v) {
				this.display.clearValues();
				return;
			}

			this.display.copyValues(v.preview);
			this.speedSlider.value.value = v.duration.value;
		});

		this.display.updateTrigger.subscribe(i => {
			if(!this.isActive) return;
			if(!this.currentlyEditing.value) return;

			this.currentlyEditing.value.preview.setValue(i, this.display.getValue(i));
		});

		this.speedSlider.value.subscribe(v => {
			if(!this.currentlyEditing.value) return;

			this.currentlyEditing.value.duration.value = v;
		});
	}

	onActivate() {
		this.display.enableSelect = false;
		this.display.clearValues();
	}

	onDeactivate() {
		this.currentlyEditing.value = null;

		if(this.runningPreview.value) {
			this.runningPreview.value.cancel();
		}
	}

	addFrame() {
		document.startViewTransition(() => {
			this.frameList.pushItem({
				preview: DisplayPreview.new({enableSelect: false}),
				duration: new ReactiveProperty(this.frameList.at(-1)?.duration.value || 0.5)
			});

			this.currentlyEditing.value = this.frameList.at(-1) || null;
			this.framesContainer.node.scrollTo({left: this.framesContainer.node.scrollWidth, behavior: "smooth"});
		});
	}

	/**
	 * @param {FrameItem} frame
	 * @param {-1 | 1} direction
	 * @memberof SequenceDisplayMode
	 */
	swapFrames(frame, direction) {
		const index = this.frameList.indexOf(frame);
		if(index === -1) return;

		const targetIndex = index + direction;
		if(targetIndex < 0 || targetIndex >= this.frameList.length) return;

		document.startViewTransition(() => {
			if(direction < 0) {
				this.frameList.spliceItems(targetIndex, 2, frame, this.frameList.items[targetIndex]);
			} else {
				this.frameList.spliceItems(index, 2, this.frameList.items[targetIndex], frame);
			}
		});
	}

	/**
	 * @param {FrameItem} frame
	 * @memberof SequenceDisplayMode
	 */
	deleteFrame(frame) {
		this.currentlyEditing.value = null;
		document.startViewTransition(() => {
			this.frameList.deleteItem(frame);
		});
	}

	async onDisplay() {
		const frameCount = this.frameList.length;

		const buffer = new Uint8Array(1 + (1 + 5) * frameCount);
		buffer[0] = this.repeatSlider.value.value;

		for(const [i, frame] of this.frameList.entries()) {
			const offset = 1 + i * 6;

			// Write the duration
			buffer[offset] = Math.round(map(frame.duration.value, this.speedSlider.min.value, this.speedSlider.max.value, 0, 255));

			// Encode the preview
			const preview = frame.preview.encode();

			// Write the preview
			buffer.set(preview, offset + 1);
		}

		await API.post("/sequence", buffer);
	}

	/**
	 * @returns {{finish: Promise<boolean>, cancel: () => void} | null}
	 * @memberof SequenceDisplayMode
	 */
	startPreview() {
		if(this.runningPreview.value) {
			this.runningPreview.value.cancel();
			return null;
		}

		// Exit edit mode
		this.currentlyEditing.value = null;
		this.submitButton.node.disabled = true;

		// Set up the display
		this.display.enableSelect = false;
		this.display.clearValues();

		let isCancelled = false;
		const cancel = () => {
			isCancelled = true;
			finalize();
		};

		const finalize = () => {
			this.display.enableSelect = true;
			this.display.clearValues();
			this.runningPreview.value = null;
			this.submitButton.node.disabled = false;
		};

		let repeatCount = this.repeatSlider.value.value;
		if(repeatCount === 255) repeatCount = Infinity;

		// Start the preview
		const promise = new Promise(async resolve => {
			await timeout(50);

			for(let i = 0; i < repeatCount; i++) {
				for(const [i, frame] of this.frameList.items.entries()) {
					if(isCancelled) return resolve(false);

					// Scroll to the frame and highlight it
					const element = this.frameList.children[i];
					element.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
					element.classList.add("highlight");

					// Copy the frame to the display
					this.display.copyValues(frame.preview);

					// Wait for the duration
					await timeout(frame.duration.value * 1000);

					// Remove the highlight
					element.classList.remove("highlight");
				}
			}
			resolve(true);
			finalize();
		});

		this.runningPreview.value = {finish: promise, cancel: cancel};

		return this.runningPreview.value;
	}

	/** @type {ItemListComponent<FrameItem>} */
	frameList = /** @type {typeof ItemListComponent<FrameItem>} */(ItemListComponent).new({
		items: [
			{
				preview: DisplayPreview.new({enableSelect: false}),
				duration: new ReactiveProperty(0.5)
			},
			{
				preview: DisplayPreview.new({enableSelect: false}),
				duration: new ReactiveProperty(0.5)
			},
			{
				preview: DisplayPreview.new({enableSelect: false}),
				duration: new ReactiveProperty(0.5)
			}
		],
		item: v => html`<div
			class="frame ${this.currentlyEditing.as(e => v === e ? "edit" : "")}"
			onclick="${e => {
				if(this.runningPreview.value) return;
				if(e.composedPath().indexOf(v.preview) === -1) return;
				this.currentlyEditing.value = v;
			}}"
		>
			${v.preview}
			<div class="top">
				<button
					class="delete"
					onclick="${() => this.deleteFrame(v)}"
				>${SVG.TIMES_CIRCLE}</button>
			</div>
			<div class="bottom">
				<button
					class="left"
					style="visibility: ${this.frameList.onChange.as(() => this.frameList.isFirst(v) ? "hidden" : "visible")}"
					onclick="${() => this.swapFrames(v, -1)}"
				>${SVG.CARET_LEFT}</button>
				<div class="info">
					<span class="duration">${v.duration.as(v => v.toFixed(2))}s</span>
				</div>
				<button
					class="right"
					style="visibility: ${this.frameList.onChange.as(() => this.frameList.isLast(v) ? "hidden" : "visible")}"
					onclick="${() => this.swapFrames(v, 1)}"
				>${SVG.CARET_RIGHT}</button>
			</div>
		</div>`
	});

	render() {
		return html`<sequence-display-mode>
			<div class="option">
				<label>Frames <small>(${this.frameList.onChange.as(() => this.frameList.length)})</small></label>
				<div class="frames" ref="${this.framesContainer}">
					${this.frameList}
					<div
						class="frame add"
						style="visibility: ${this.runningPreview.as(v => v ? "hidden" : "visible")}"
						onclick="${() => this.addFrame()}"
					>${SVG.PLUS}</div>
				</div>
			</div>
			<div class="option">
				<label>Repeat Count</label>
				${this.repeatSlider}
			</div>
			<div
				class="option"
				style="display: ${this.currentlyEditing.as(v => v ? "block" : "none")}"
			>
				<label>Duration</label>
				${this.speedSlider}
			</div>
			<div class="actions">
				<button
					class="button ${this.runningPreview.as(v => v ? "primary" : "secondary")}"
					onclick="${e => this.startPreview()}"
				>${this.runningPreview.as(v => v ? "Stop Preview" : "Preview")}</button>
				<button
					ref="${this.submitButton}"
					class="button primary"
					onclick="${() => this.onDisplay()}"
				>Display</button>
			</div>
		</pattern-display-mode>`;
	}
}
Component.register(SequenceDisplayMode);

class MainApp extends Component {
	static tagName = "main-app";

	display = DisplayPreview.new({enableSelect: true});

	modeSelect = ModeSelect.new({
		pages: [
			TextDisplayMode.new({display: this.display}),
			PatternDisplayMode.new({display: this.display}),
			SequenceDisplayMode.new({display: this.display})
		]
	});

	async init() { }

	onMount() { }

	render() {
		return html`<main-app>
			${this.display}
			${this.modeSelect}
		</main-app>`;
	}
}
Component.register(MainApp);


class API {
	static API_BASE = "/api";

	// eslint-disable-next-line valid-jsdoc
	/**
	 * @static
	 * @param {string} url
	 * @param {RequestInit} [options]
	 * @return {ReturnType<typeof API["fetch"]>} 
	 * @memberof API
	 */
	static get(url, options = {}) {
		return this.fetch(url, Object.assign({}, options, {method: "GET"}));
	}

	// eslint-disable-next-line valid-jsdoc
	/**
	 * @static
	 * @param {string} url
	 * @param {Uint8Array} [body]
	 * @param {RequestInit} [options]
	 * @return {ReturnType<typeof API["fetch"]>} 
	 * @memberof API
	 */
	static post(url, body, options = {}) {
		return this.fetch(url, Object.assign({}, options, {method: "POST"}, body ? {body: body} : {}));
	}

	// eslint-disable-next-line valid-jsdoc
	/**
	 * @static
	 * @param {string} url
	 * @param {RequestInit} options
	 * @return {Promise<string>} 
	 * @memberof API
	 */
	static async fetch(url, options) {
		return fetch(this.API_BASE + url, options)
			.then(res => res.text())
			.catch(err => {
				console.error(err);
				alert(`Failed to fetch:\n\n${options.method || "GET"} ${url}\n\nError: ${err}\n${err ? err.stack : ""}`);
				return "";
			});
	}
}