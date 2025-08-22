import * as L from 'leaflet';

export const createWhiteTileLayer = (): L.TileLayer => {
    const WhiteTileLayer = (L.TileLayer as any).extend({
        createTile: function(coords: any, done: any) {
            const tile = document.createElement('canvas');
            tile.width = 256;
            tile.height = 256;
            const ctx = tile.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 256, 256);
            }
            setTimeout(() => done(null, tile), 0);
            return tile;
        }
    });

    return new WhiteTileLayer('', {
        attribution: 'White Background',
        minZoom: 1,
        maxZoom: 18
    });
};


