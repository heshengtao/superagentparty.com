/* ==========================================================================
   Deep-space backdrop — particle field + orbital rings (Three.js)
   Loads on demand; the CSS star layers stay as the permanent fallback.
   ========================================================================== */
(function () {
  "use strict";

  var CDN = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.min.js";

  window.SAP = window.SAP || {};

  window.SAP.starfield = function () {
    var canvas = document.getElementById("starfield");
    if (!canvas) return;

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var probe = document.createElement("canvas");
    if (!probe.getContext("webgl") && !probe.getContext("experimental-webgl")) return;

    import(CDN).then(boot).catch(function () {
      /* CDN unreachable — CSS starfield carries the page */
    });

    function boot(THREE) {
      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: true,
          antialias: false,
          powerPreference: "high-performance"
        });
      } catch (e) {
        return;
      }

      var small = window.innerWidth < 760;
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 1, 2600);
      camera.position.set(0, 0, 470);

      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.8));
      renderer.setSize(window.innerWidth, window.innerHeight, false);

      /* ---- star layers -------------------------------------------------- */
      var COL_WARM = [0xffffff, 0xdbeafe, 0x22d3ee, 0xffffff];
      var COL_DEEP = [0xffffff, 0x8b5cf6, 0x64748b, 0xf472b6];

      /* Soft round sprite — without it WebGL draws hard squares. */
      var sprite = (function () {
        var size = 64;
        var c = document.createElement("canvas");
        c.width = c.height = size;
        var ctx = c.getContext("2d");
        var grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, "rgba(255,255,255,1)");
        grad.addColorStop(0.22, "rgba(255,255,255,0.9)");
        grad.addColorStop(0.55, "rgba(255,255,255,0.22)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        var texture = new THREE.CanvasTexture(c);
        texture.needsUpdate = true;
        return texture;
      })();

      function makeStars(count, spread, size, opacity, palette) {
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        var color = new THREE.Color();

        for (var i = 0; i < count; i++) {
          var r = spread * (0.32 + Math.random() * 0.68);
          var theta = Math.random() * Math.PI * 2;
          var phi = Math.acos(2 * Math.random() - 1);
          var sinPhi = Math.sin(phi);

          positions[i * 3] = r * sinPhi * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.cos(phi);
          positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);

          color.setHex(palette[(Math.random() * palette.length) | 0]);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }

        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        return new THREE.Points(geometry, new THREE.PointsMaterial({
          size: size,
          map: sprite,
          vertexColors: true,
          transparent: true,
          opacity: opacity,
          alphaTest: 0.002,
          sizeAttenuation: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
      }

      var field = new THREE.Group();
      var far = makeStars(small ? 6500 : 13000, 1600, 1.9, 0.5, COL_DEEP);
      var near = makeStars(small ? 4200 : 9000, 900, 2.8, 0.85, COL_WARM);
      field.add(far, near);
      scene.add(field);

      /* ---- orbital system ----------------------------------------------- */
      function makeRing(radius, hex, opacity, tiltX, tiltZ) {
        var segments = 200;
        var points = [];
        for (var i = 0; i <= segments; i++) {
          var a = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
        }
        var line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color: hex,
            transparent: true,
            opacity: opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending
          })
        );
        line.rotation.x = tiltX;
        line.rotation.z = tiltZ;
        return line;
      }

      var system = new THREE.Group();
      system.position.set(215, -8, -150);
      system.add(makeRing(140, 0x22d3ee, 0.42, 1.18, 0.30));
      system.add(makeRing(205, 0x8b5cf6, 0.34, 1.35, -0.36));
      system.add(makeRing(275, 0xf472b6, 0.22, 1.02, 0.58));

      var core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(32, 1),
        new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          wireframe: true,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      system.add(core);
      scene.add(system);

      /* ---- interaction --------------------------------------------------- */
      var pointer = { x: 0, y: 0 };
      var target = { x: 0, y: 0 };
      var scrolled = 0;

      window.addEventListener("pointermove", function (e) {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });

      window.addEventListener("scroll", function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        scrolled = max > 0 ? window.scrollY / max : 0;
      }, { passive: true });

      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var w = window.innerWidth;
          var h = window.innerHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 760 ? 1.5 : 1.8));
          renderer.setSize(w, h, false);
        }, 160);
      }, { passive: true });

      var running = !document.hidden;
      document.addEventListener("visibilitychange", function () {
        running = !document.hidden;
        clock.getDelta();
      });

      canvas.addEventListener("webglcontextlost", function (e) {
        e.preventDefault();
        running = false;
        canvas.classList.remove("is-ready");
      }, false);

      var clock = new THREE.Clock();
      var shown = false;

      function frame() {
        requestAnimationFrame(frame);
        if (!running) return;

        var dt = Math.min(clock.getDelta(), 0.05);
        var time = clock.elapsedTime;

        pointer.x += (target.x - pointer.x) * 0.045;
        pointer.y += (target.y - pointer.y) * 0.045;

        field.rotation.y = time * 0.012 + pointer.x * 0.12;
        field.rotation.x = pointer.y * -0.08;
        field.position.z = scrolled * 300;

        system.rotation.y = time * 0.055 + pointer.x * 0.24;
        system.rotation.x = Math.sin(time * 0.08) * 0.06 + pointer.y * -0.15;

        core.rotation.x += dt * 0.22;
        core.rotation.y += dt * 0.34;

        camera.position.x += (pointer.x * 26 - camera.position.x) * 0.05;
        camera.position.y += (-pointer.y * 18 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);

        if (!shown) {
          shown = true;
          canvas.classList.add("is-ready");
        }
      }

      frame();
    }
  };
})();
