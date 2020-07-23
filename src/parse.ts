import {split} from "eol";

export interface ParseChunk {
    chunkContent: string;
    chunkType: string;
    evalFlags: string[];
    startLine: number;
    endLine: number;
}

export function parseNotebookContent(notebookContentString: string) {
    // Adapted from https://github.com/iodide-project/iodide/blob/master/src/editor/iomd-tools/iomd-parser.js
    // MIT licensed

    const iomdLines = split(notebookContentString);

    const chunks: ParseChunk[] = [];
    let currentChunkLines: string[] = [];
    let currentEvalType = "";
    let evalFlags: string[] = [];
    let currentChunkStartLine = 1;

    let frontMatter = "";
  
    const pushChunk = (endLine: number) => {
      const chunkContent = currentChunkLines.join("\n");
      chunks.push({
        chunkContent,
        chunkType: currentEvalType,
        evalFlags,
        startLine: currentChunkStartLine,
        endLine
      });
    };
  
    for (const [i, line] of iomdLines.entries()) {

      const lineNum = i + 1; // monaco uses 1-based indexing
      if (line.slice(0, 2) === "%%") {
        // if line start with '%%', a new chunk has started
        // push the current chunk (unless it's on line 1), then reset
        if (lineNum !== 1) {
          // DON'T push a chunk if we're only on line 1

          if (currentEvalType === "") {
            frontMatter = currentChunkLines.join("\n");
          } else {
            pushChunk(lineNum - 1);
          }
        }
        // reset the currentChunk state
        currentChunkStartLine = lineNum;
        currentChunkLines = [];
        evalFlags = [];
        // find the first char on this line that isn't '%'
        let lineColNum = 0;
        while (line[lineColNum] === "%") {
          lineColNum += 1;
        }
        const chunkFlags = line
          .slice(lineColNum)
          .split(/[ \t]+/)
          .filter(s => s !== "");
        if (chunkFlags.length > 0) {
          // if there is a captured group, update the eval type
          [currentEvalType, ...evalFlags] = chunkFlags;
        }
      } else {
        // if there is no match, then the line is not a
        // chunk delimiter line, so add the line to the currentChunk
        currentChunkLines.push(line);
      }
    }
    // this is what's left over in the final chunk
    pushChunk(iomdLines.length);
    return {
      chunks,
      frontMatter
    };
  }
