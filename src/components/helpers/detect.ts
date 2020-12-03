/**
 * A very naive mobile detection that only checks for touchscreen support.
 * This is used for Monaco vs CodeMirror default, where this makes sense.
 * 
 * Of course there are laptops with touchscreens too, but guessing the wrong
 * default isn't the end of the world.
 */
export function isATouchScreenDevice() {
    try {  
        document.createEvent("TouchEvent");  
        return true;  
    } catch (e) {  
        return false;  
    }  
}
