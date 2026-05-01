import { EventEmitter } from 'events';

const sessions = new Map<string, any>();
const publishers = new Map<string, any>();
const idlePlayers = new Set<any>();
const nodeEvent = new EventEmitter();
const stat = {
  inbytes: 0,
  outbytes: 0,
  accepted: 0,
};
const server: Record<string, unknown> = {};

export = { sessions, publishers, idlePlayers, nodeEvent, stat, server };
