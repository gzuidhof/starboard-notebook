import {registry} from "./cellHandler/registry";

const w = window as any;

w.runtime = {
    registry: registry
};
