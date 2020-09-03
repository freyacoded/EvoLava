export interface NodeInfo {
    activePlayers: number;
    memory: {
        reserved: number,
        used: number,
        free: number,
        allocated: number
    },
    players: number,
    cpu: {
        cores: number,
        load: number,
        lavaload: number
    },
    uptime: number
}