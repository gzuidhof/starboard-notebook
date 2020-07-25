/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Adapted from jsconsole, MIT licensed */
import { parse } from '@babel/parser';
import {simple} from 'babylon-walk';
import { ConsoleCatcher } from './console/console';
 
declare global {
  interface Window {
    $_: any;
    eval: (command: string) => any;
  }
}

interface RunResult {
    error: boolean;
    command: string;
    value?: any;
}

export class Runtime {
  public consoleCatcher: ConsoleCatcher;

  constructor() {
    this.consoleCatcher = new ConsoleCatcher(window.console);
    
  }

  async run(command: string): Promise<RunResult> {
    const res: RunResult = {
      error: false,
      command,
    };

    try {
      // // trick from devtools
      // // via https://chromium.googlesource.com/chromium/src.git/+/4fd348fdb9c0b3842829acdfb2b82c86dacd8e0a%5E%21/#F2
      if (/^\s*\{/.test(command) && /\}\s*$/.test(command)) {
        command = `(${command})`;
      }

      const { content } = preProcess(command);

      if (!window) {
        res.error = true;
        res.value = "Run error: container or window is null";
        return res;
      }
      
      res.value = await window.eval(content);

      (window)["$_"] = res.value;
      return res;

    } catch (error) {
      res.error = true;
      res.value = error;
      return res;
    }

  }
}

export function preProcess(content: string) {
  let wrapped = '(async () => {' + content + '\n})()';
  const root = parse(wrapped, { ecmaVersion: 8 } as any);
  const body = (root.program.body[0] as any).expression.callee.body;

  const changes: any[] = [];

  const visitors = {
    ClassDeclaration(node: any) {
      if (node.parent === body)
        changes.push({
          text: node.id.name + '=',
          start: node.start,
          end: node.start,
        });
    },
    FunctionDeclaration(node: any) {
      changes.push({
        text: node.id.name + '=',
        start: node.start,
        end: node.start,
      });
      return node;
    },
    VariableDeclaration(node: any) {
      if (node.kind !== 'var' && node.parent !== body) return;
      const onlyOneDeclaration = node.declarations.length === 1;
      changes.push({
        text: onlyOneDeclaration ? 'void' : 'void (',
        start: node.start,
        end: node.start + node.kind.length,
      });
      for (const declaration of node.declarations) {
        if (!declaration.init) {
          changes.push({
            text: '(',
            start: declaration.start,
            end: declaration.start,
          });
          changes.push({
            text: '=undefined)',
            start: declaration.end,
            end: declaration.end,
          });
          continue;
        }
        changes.push({
          text: '(',
          start: declaration.start,
          end: declaration.start,
        });
        changes.push({
          text: ')',
          start: declaration.end,
          end: declaration.end,
        });
      }
      if (!onlyOneDeclaration) {
        const last = node.declarations[node.declarations.length - 1];
        changes.push({ text: ')', start: last.end, end: last.end });
      }
    },
  };

  simple(body, visitors, undefined);

  const last = body.body[body.body.length - 1];
  if (last === undefined) {
    return {
      content,
    };
  }

  if (last.type === 'ExpressionStatement') {
    changes.push({
      text: 'return window.$_ = (',
      start: last.start,
      end: last.start,
    });
    if (wrapped[last.end - 1] !== ';')
      changes.push({ text: ')', start: last.end, end: last.end });
    else changes.push({ text: ')', start: last.end - 1, end: last.end - 1 });
  }

  while (changes.length) {
    const change = changes.pop() as any;
    wrapped =
      wrapped.substr(0, change.start) +
      change.text +
      wrapped.substr(change.end);
  }

  return { content: wrapped };
}
