const fs = require("fs");
const path = require("path");
const minify = import("minify");

const HTML_ENTRY = path.resolve(__dirname, "frontend/page.html");
const OUTPUT_DIR = path.resolve(__dirname, "backend");

(async function main() {
	const dir = path.dirname(HTML_ENTRY);
	let html = fs.readFileSync(HTML_ENTRY, "utf8");

	// Scan for all embed script tags
	html = html.replace(/<script.*?src="(.*?)".*?><\/script>/g, (_, src) => {
		const scriptPath = path.resolve(dir, src);
		const scriptContent = fs.readFileSync(scriptPath, "utf8");
		return `<script>${scriptContent}</script>`;
	});

	// Scan for all embed style tags
	html = html.replace(/<link.*?href="(.*?)".*?>/g, (m, href) => {
		// Ignore non-stylesheet links
		if(m.indexOf('rel="stylesheet"') === -1) return m;

		// Ignore external links
		if(href.startsWith("http")) return m;

		const stylePath = path.resolve(dir, href);
		const styleContent = fs.readFileSync(stylePath, "utf8");
		return `<style>${styleContent}</style>`;
	});

	// Output the final HTML
	const fileName = path.basename(HTML_ENTRY);
	const outputPath = path.resolve(OUTPUT_DIR, fileName);
	if(!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, {recursive: true});
	fs.writeFileSync(outputPath, html);

	// Minify the HTML
	const minified = await (await minify).minify(outputPath);
	fs.writeFileSync(outputPath, minified);

	// Save file as C header
	const cHeader = path.resolve(OUTPUT_DIR, fileName + ".h");
	const str = minified
		.replace(/\\/g, "\\\\")
		.replace(/"/g, "\\\"")
		.replace(/\t/g, "\\t")
		.replace(/\n/g, "\\n");
	fs.writeFileSync(cHeader, `const char* ${fileName.replace(/[^0-9a-z_]+/gi, "_").toUpperCase()} = "${str}";`);
})();