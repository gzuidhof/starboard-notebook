/**
 * Matplotlib currently creates a dom element which never gets attached to the DOM.
 * Without a way to specify our own DOM node creation function, we override it here - saving us from shipping our own matplotlib package.
 */
export function patchMatplotlib(module: { runPythonSimple: (code: string) => any }) {
  // Switch to simpler matplotlib backend https://github.com/jupyterlite/jupyterlite/blob/main/packages/pyolite-kernel/py/pyolite/pyolite/patches.py
  module.runPythonSimple(`import os
os.environ["MPLBACKEND"] = "AGG"`);

  module.runPythonSimple(`import matplotlib
import matplotlib.pyplot
from pyodide import create_proxy
from js import drawPyodideCanvas

def show():
  canvas = matplotlib.pyplot.gcf().canvas
  canvas.draw()
  pixels = canvas.buffer_rgba().tobytes()
  width, height = canvas.get_width_height()
  drawPyodideCanvas(pixels, width, height)
  return None

# This is probably the better approach, but the object passing stuff doesn't support typed arrays yet
def showUint8():
  pixels_proxy = None
  pixels_buf = None
  try:
    canvas = matplotlib.pyplot.gcf().canvas
    canvas.draw()
    pixels = canvas.buffer_rgba().tobytes()
    pixels_proxy = create_proxy(pixels)
    pixels_buf = pixels_proxy.getBuffer("u8clamped")
    drawPyodideCanvas(pixels)
  finally:
    if pixels_proxy:
      pixels_proxy.destroy()
    if pixels_buf:
      pixels_buf.release()

matplotlib.pyplot.show = show
`);
}
