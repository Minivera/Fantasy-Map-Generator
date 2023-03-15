const oceanTexture = PIXI.Texture.from('./images/pattern1.png');
const mountainTexture = PIXI.Texture.from('./images/relief/mount-2-bw.png');

class PixiRenderer {
  constructor() {
    this.app = new PIXI.Application({
      antialias: true,
      width: graphWidth,
      height: graphHeight,
      background: 0x466eab,
    });

    document.body.appendChild(this.app.view);

    this.viewport = new pixi_viewport.Viewport({
      screenWidth: graphWidth,
      screenHeight: graphHeight,
      worldWidth: graphWidth,
      worldHeight: graphHeight,
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

    this.viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    this.viewport.fit()
    this.viewport.moveCenter(graphWidth / 2, graphHeight / 2);

    this.oceanRect = new PIXI.Graphics();
    this.waterHalo = new PIXI.Container();
    this.landmasses = new PIXI.smooth.SmoothGraphics();
    this.graphics = new PIXI.Graphics();

    this.viewport.addChild(this.oceanRect);
    this.viewport.addChild(this.waterHalo);
    this.viewport.addChild(this.graphics);
    this.viewport.addChild(this.landmasses);

    /*this.app.view.addEventListener('wheel', event => {
      event.preventDefault();

      this.zoom([event.clientX, event.clientY], event.deltaY);
    });*/
  }

  zoom(mousePos, direction) {
    if (direction < 0) {
      // ZOOM in
      this.app.stage.scale.x = Math.min(this.app.stage.scale.x + 0.1, 3.0);
      this.app.stage.scale.y = Math.min(this.app.stage.scale.y + 0.1, 3.0);
    } else {
      // ZOOM out
      this.app.stage.scale.x = Math.max(this.app.stage.scale.x - 0.1, 1.0);
      this.app.stage.scale.y = Math.max(this.app.stage.scale.y - 0.1, 1.0);
    }

    this.app.stage.pivot.x += mousePos[0] * this.app.stage.scale.x;
    this.app.stage.pivot.y += mousePos[1] * this.app.stage.scale.y;
  }

  pan(deltaX, deltaY) {
    this.app.stage.position.x += deltaX;
    this.app.stage.position.y += deltaY;
  }

  drawOcean () {
    this.oceanRect.clear();
    this.waterHalo.removeChildren();
    this.landmasses.clear();

    this.oceanRect.beginTextureFill({ texture: oceanTexture });
    this.oceanRect.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.oceanRect.endFill();

    this.oceanRect.beginFill(0x466eab, 0.75);
    this.oceanRect.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.oceanRect.endFill();

    const { cells, vertices, features } = pack;

    const data = cells.i;
    const n = cells.i.length;
    const used = new Uint8Array(features.length);

    data.forEach(i => {
      const startFromEdge = !i && cells.h[i] >= 20;
      if (!startFromEdge && cells.t[i] !== -1 && cells.t[i] !== 1) {
        return;
      }

      const feature = cells.f[i];
      if (used[feature] || features[feature].type === "ocean") {
        return;
      }

      const type = features[feature].type === "lake" ? 1 : -1; // type value to search for
      const start = findStart(i, type);
      if (start === -1) {
        return;
      }

      const vchain = connectVertices(start, type);
      used[feature] = 1;
      const points = vchain.map(v => //[
        vertices.p[v]);//,
        //polygon(cells.v.findIndex((vert, index) => vert.includes(v) && cells.t[index] >= 0)),
      //]);

      this.landmasses.beginFill(0xffffff, 0);
      this.landmasses.lineStyle(2, 0x808080, 0.75);

      const [firstPoint, ...rest] = points;
      const screenFirstPoint = this.toScreenPoint(firstPoint);
      this.landmasses.moveTo(screenFirstPoint[0], screenFirstPoint[1]);

      rest.forEach(point => {
        const screenPoint = this.toScreenPoint(point);
        this.landmasses.lineTo(
          screenPoint[0],
          screenPoint[1],
        );
      });
      this.landmasses.closePath();
      this.landmasses.endFill();

      if (features[feature].type === "lake") {
        return;
      }

      const currentHalo = new PIXI.Graphics();
      currentHalo.blendMode = PIXI.BLEND_MODES.ADD;

      /*currentHalo.setTransform(
        massCenter[0],
        massCenter[1],
        1.25,
        1.25,
        0,
        0,
        0,
        massCenter[0],
        massCenter[1],
      );*/

      // Render whitish halo around landmass
      currentHalo.beginFill(0xffffff, 0.35);
      currentHalo.lineStyle(0, 0xffffff, 0);

      let lastPoint = firstPoint;
      rest.forEach((point) => {
        if (this.getDistance(lastPoint[0], lastPoint[1], point[0], point[1]) <= 5) {
          return;
        }

        const middlePoint = [(lastPoint[0] + point[0]) / 2, (lastPoint[1] + point[1]) / 2];

        const screenPoint = this.toScreenPoint(middlePoint);
        currentHalo.drawCircle(
          screenPoint[0],
          screenPoint[1],
          15,
        );
        lastPoint = point;
      });
      currentHalo.closePath();
      currentHalo.endFill();

      this.waterHalo.addChild(currentHalo);
    });

    function findStart(i, t) {
      if (t === -1 && cells.b[i]) {
        return cells.v[i].find(v => vertices.c[v].some(c => c >= n));
      }

      const filtered = cells.c[i].filter(c => cells.t[c] === t);
      const index = cells.c[i].indexOf(d3.min(filtered));

      return index === -1 ? index : cells.v[i][index];
    }

    function connectVertices(start, t) {
      const chain = []; // vertices chain to form a path

      for (let i = 0, current = start; i === 0 || (current !== start && i < 50000); i++) {
        const prev = chain[chain.length - 1]; // previous vertex in chain
        chain.push(current); // add current vertex to sequence

        const c = vertices.c[current]; // cells adjacent to vertex
        const v = vertices.v[current]; // neighboring vertices
        const c0 = c[0] >= n || cells.t[c[0]] === t;
        const c1 = c[1] >= n || cells.t[c[1]] === t;
        const c2 = c[2] >= n || cells.t[c[2]] === t;

        if (v[0] !== prev && c0 !== c1) {
          current = v[0];
        } else if (v[1] !== prev && c1 !== c2) {
          current = v[1];
        } else if (v[2] !== prev && c0 !== c2) {
          current = v[2];
        }

        if (current === chain[chain.length - 1]) {
          ERROR && console.error("Next vertex is not found");
          break;
        }
      }

      return chain;
    }
  };

  drawRelief() {
    const cells = pack.cells;

    const density = terrain.attr("density") || 0.4;
    const relief = [];

    for (const i of cells.i) {
      const height = cells.h[i];
      if (height < 20) {
        continue;
      }
      if (cells.r[i]) {
        continue;
      }
      const biome = cells.biome[i];
      if (height < 50 && biomesData.iconsDensity[biome] === 0) {
        continue;
      }

      const polygon = getPackPolygon(i);
      const [minX, maxX] = d3.extent(polygon, p => p[0]);
      const [minY, maxY] = d3.extent(polygon, p => p[1]);

      if (height > 50) {
        placeReliefIcons(i);
      }

      function placeReliefIcons(i) {
        const radius = 2 / density;

        for (const [cx, cy] of poissonDiscSampler(minX, minY, maxX, maxY, radius)) {
          if (!d3.polygonContains(polygon, [cx, cy])) {
            continue;
          }

          relief.push({x: rn(cx - 50, 2), y: rn(cy - 50, 2), s: rn(50 * 2, 2)});
        }
      }
    }

    // sort relief icons by y+size
    relief.sort((a, b) => a.y + a.s - (b.y + b.s));

    relief.forEach(reliefElement => {
      const mountain = new PIXI.Sprite(mountainTexture);
      mountain.anchor.set(0.5);
      mountain.x = reliefElement.x;
      mountain.y = reliefElement.y;
      this.graphics.addChild(mountain);
    });
  }

  drawPixiCells({ drawCells, drawBiomes, drawStates } = {}) {
    TIME && console.time("drawPixiCells");
    this.drawOcean();

    this.graphics.clear();

    const { cells, states } = pack;

    const data = cells.i;
    const polygon = getPackPolygon;

    data.forEach(i => {
      const score = cells.s[i];

      if (score <= 0) {
        return;
      }

      const poly = polygon(i);

      if (drawBiomes) {
        let biomeColor = biomesData.color[cells.biome[i]];
        biomeColor = Number(biomeColor.replace('#', '0x'));

        this.graphics.lineStyle(0, biomeColor, 0.75);
        this.graphics.beginFill(biomeColor, 1);
        this.graphics.drawPolygon(poly.map(point => {
          const screenPoint = this.toScreenPoint(point);
          return {
            x: screenPoint[0],
            y: screenPoint[1],
          };
        }));
        this.graphics.endFill();
      }

      if (drawCells) {
        this.graphics.lineStyle(1, 0x808080, 0.75);
        this.graphics.beginFill(0xffffff, 0);
        this.graphics.drawPolygon(poly.map(point => {
          const screenPoint = this.toScreenPoint(point);
          return {
            x: screenPoint[0],
            y: screenPoint[1],
          };
        }));
        this.graphics.endFill();
      }

      if (drawStates) {
        let biomeColor = states[cells.state[i]]?.color || '#666666';
        biomeColor = Number(biomeColor.replace('#', '0x'));

        this.graphics.lineStyle(1, biomeColor, 0.75);
        this.graphics.beginFill(biomeColor, 1);
        this.graphics.drawPolygon(poly.map(point => {
          const screenPoint = this.toScreenPoint(point);
          return {
            x: screenPoint[0],
            y: screenPoint[1],
          };
        }));
        this.graphics.endFill();
      }
    });

    this.drawRelief();

    TIME && console.timeEnd("drawPixiCells");
  }

  getDistance(xA, yA, xB, yB) {
    const xDiff = xA - xB;
    const yDiff = yA - yB;

    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }

  getPolygonCenter(points) {
    const first = points[0];
    const last = points[points.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      points.push(first);
    }

    let twicearea = 0;
    let x = 0;
    let y = 0;
    const nPts = points.length;
    let p1;
    let p2;
    let f;

    for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
      p1 = points[i];
      p2 = points[j];
      f = p1[0] * p2[1] - p2[0] * p1[1];

      twicearea += f;
      x += (p1[0] + p2[0]) * f;
      y += (p1[1] + p2[1]) * f;
    }

    f = twicearea * 3;

    return [x / f, y / f];
  }

  getVectorAngle(p2, p1) {
    return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  }

  getOppositePoint(p1, p2, distance) {
    const deltaX = p2[0] - p1[0];
    const deltaY = p2[1] - p1[1];
    const actualDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const scaleX = deltaX / actualDistance;
    const scaleY = deltaY / actualDistance;

    return [
      p2[0] - scaleX * distance,
      p2[1] - scaleY * distance,
    ];
  }

  toScreenPoint(point) {
    return [
      (point[0] * this.app.screen.width) / graphWidth,
      (point[1] * this.app.screen.height) / graphHeight,
    ];
  }
}

