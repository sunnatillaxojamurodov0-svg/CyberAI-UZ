import { useRef, useEffect, useState, useCallback } from "react";
import "./GooeyNav.css";

interface GooeyNavItem {
  label: string;
  href: string;
}

interface GooeyNavProps {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: number[];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
  onNavigate?: (href: string) => void;
}

const GooeyNav = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
  onNavigate,
}: GooeyNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i: number, t: number, d: number[], r: number) => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = useCallback(
    (element: HTMLElement) => {
      const d = particleDistances;
      const r = particleR;

      for (let i = 0; i < particleCount; i++) {
        const t = animationTime * 2 + noise(timeVariance * 2);
        const p = createParticle(i, t, d, r);

        setTimeout(() => {
          const particle = document.createElement("span");
          const point = document.createElement("span");
          particle.classList.add("particle");
          particle.style.setProperty("--start-x", `${p.start[0]}px`);
          particle.style.setProperty("--start-y", `${p.start[1]}px`);
          particle.style.setProperty("--end-x", `${p.end[0]}px`);
          particle.style.setProperty("--end-y", `${p.end[1]}px`);
          particle.style.setProperty("--time", `${p.time}ms`);
          particle.style.setProperty("--scale", `${p.scale}`);
          particle.style.setProperty("--color", `var(--color-${p.color}, white)`);
          particle.style.setProperty("--rotate", `${p.rotate}deg`);

          point.classList.add("point");
          particle.appendChild(point);
          element.appendChild(particle);

          setTimeout(() => {
            try {
              element.removeChild(particle);
            } catch {
              // Element already removed
            }
          }, t);
        }, 30);
      }
    },
    [animationTime, particleCount, particleDistances, particleR, timeVariance, colors],
  );

  const updateEffectPosition = useCallback((element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    filterRef.current.style.left = `${pos.x - containerRect.x}px`;
    filterRef.current.style.top = `${pos.y - containerRect.y}px`;
    filterRef.current.style.width = `${pos.width}px`;
    filterRef.current.style.height = `${pos.height}px`;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
      e.preventDefault();
      const liEl = e.currentTarget.parentElement;
      if (!liEl || activeIndex === index) return;

      setActiveIndex(index);
      updateEffectPosition(liEl);

      if (filterRef.current) {
        // Remove old particles
        const particles = filterRef.current.querySelectorAll(".particle");
        particles.forEach((p) => filterRef.current!.removeChild(p));

        // Start particle animation
        setIsAnimating(true);
        makeParticles(filterRef.current);

        // Stop animation after particles finish
        setTimeout(
          () => {
            setIsAnimating(false);
          },
          animationTime * 2 + timeVariance,
        );
      }

      onNavigate?.(items[index].href);
    },
    [
      activeIndex,
      updateEffectPosition,
      makeParticles,
      onNavigate,
      items,
      animationTime,
      timeVariance,
    ],
  );

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi as HTMLElement);
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[activeIndex];
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi as HTMLElement);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex, updateEffectPosition]);

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={index} className={activeIndex === index ? "active" : ""}>
              <a href={item.href} onClick={(e) => handleClick(e, index)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <span className={`effect filter ${isAnimating ? "animating" : ""}`} ref={filterRef} />
    </div>
  );
};

export default GooeyNav;
