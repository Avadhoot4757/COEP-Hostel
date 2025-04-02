import { useEffect, useRef } from 'react';

export default function useIntersectionObserver(selector:string) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting || !entry.isIntersecting) {
          const element = entry.target;
          const isVisible = entry.isIntersecting;
          
          element.classList.remove('visible');
          
          if (isVisible) {
            setTimeout(() => {
              element.classList.add('visible');
            }, 100);
          }
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '-50px'
    });

    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [selector]);
}