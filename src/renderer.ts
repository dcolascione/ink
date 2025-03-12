import renderNodeToOutput from './render-node-to-output.js';
import Output from './output.js';
import {type DOMElement} from './dom.js';
import ansiEscapes from 'ansi-escapes';
import { DEFAULT_TERMINAL_HEIGHT } from './constants.js';

type Result = {
	output: string;
	staticOutput: string;
};

// Keep track of all static output we've rendered so far
let staticContentPreviously: string = '';
// Keep track of the terminal width when we last rendered
let previousTerminalWidth: number = 0;

const renderer = (node: DOMElement,
		  startOscPrompt: string,
		  endOscPrompt: string): Result => {
	if (node.yogaNode) {
		const currentTerminalWidth = node.yogaNode.getComputedWidth();
		const wantedHeight = node.yogaNode.getComputedHeight();

		const output = new Output({
			width: currentTerminalWidth,
			height: wantedHeight,
			startOscPrompt: startOscPrompt,
			endOscPrompt: endOscPrompt,
		});

		renderNodeToOutput(node, output, {skipStaticElements: true});

		let staticOutput;

		if (node.staticNode?.yogaNode) {
			staticOutput = new Output({
				width: node.staticNode.yogaNode.getComputedWidth(),
				height: node.staticNode.yogaNode.getComputedHeight(),
				startOscPrompt: startOscPrompt,
				endOscPrompt: endOscPrompt,
			});

			renderNodeToOutput(node.staticNode, staticOutput, {
				skipStaticElements: false,
			});
		}

		// If our old output is a prefix of our new output, we can just output
		// the delta.  If it's not, then we have to refresh the screen
		// and output the whole thing from scratch.

		const {output: generatedOutput, height: _} = output.get();
		let staticOutputNow = staticOutput
                                        ? staticOutput.get().output
					: '';
		let clearScreen = '';

		const terminalRows = process.stdout.rows || DEFAULT_TERMINAL_HEIGHT;

		// Only do incremental update if:
		// - width hasn't changed
		// - content is a prefix of previous content

		// We need the last clause to account for the case when
		// the non-static content size is taller than the viewport:
		// we need to render it partially into scrollback in this case,
		// and the only portable way to edit scrollback is to clear and
		// refresh it.

		if (currentTerminalWidth === previousTerminalWidth &&
			wantedHeight < terminalRows &&
			staticOutputNow.startsWith(staticContentPreviously)) {
			let delta = staticOutputNow.substring(
				staticContentPreviously.length);
			staticContentPreviously += delta;
			staticOutputNow = delta;
		} else {
			// Either width changed or content changed significantly - full redraw
			clearScreen = ansiEscapes.clearTerminal;
			staticContentPreviously = staticOutputNow;
			previousTerminalWidth = currentTerminalWidth;
		}

		return {
			output: generatedOutput,
			staticOutput: `${clearScreen}${staticOutputNow}`,
		};
	}

	return {
		output: '',
		staticOutput: '',
	};
};

export default renderer;
