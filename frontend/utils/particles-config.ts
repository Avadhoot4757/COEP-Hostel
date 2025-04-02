export const particlesConfig = {
    fpsLimit: 120,
    particles: {
      color: {
        value: ["#fdcf58", "#f27d0c", "#800909", "#f07f13"]
      },
      move: {
        enable: true,
        direction: "top",
        random: true,
        speed: 3,
        straight: false,
        outMode: "out", 
        bounce: false,
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200
        }
      },
      number: {
        density: {
          enable: true,
          area: 800
        },
        value: 200
      },
      opacity: {
        value: 0.7,
        random: true,
        anim: {
          enable: true,
          speed: 0.5,
          opacity_min: 0.1,
          sync: false
        }
      },
      shape: {
        type: "circle"
      },
      size: {
        value: { min: 2, max: 5 },
        random: true,
        anim: {
          enable: true,
          speed: 2,
          size_min: 0.1,
          sync: false
        }
      }
    },
    detectRetina: true,
    fullScreen: {
      enable: true,
      zIndex: 0
    },
    background: {
      color: "#f5f5f5"
    }
  };