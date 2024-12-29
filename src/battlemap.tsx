import {
  createContext,
  useContext,
  useRef,
  type ComponentProps,
  type PointerEvent,
  type PointerEventHandler,
  type PropsWithoutRef,
  type ReactNode,
  type Ref,
  type RefCallback,
  type SVGProps,
} from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { CharacterRecord, MarkerType, SelectForm } from "./schema";

const DraggableContext = createContext<{
  setHeld: (el: DragHandler) => void;
}>({
  setHeld() {
    throw new Error();
  },
});

const LMOUSE = 0;

type DragHandler = PointerEventHandler;

export function DraggableProvider(props: {
  children: (props: {
    onPointerMove: PointerEventHandler;
    onPointerUp: PointerEventHandler;
    onPointerLeave: PointerEventHandler;
  }) => ReactNode;
}) {
  const { children } = props;

  const held = useRef<DragHandler | null>(null);

  function update(e: PointerEvent) {
    const { current } = held;
    current?.(e);
    if ((e.buttons & (1 << LMOUSE)) === 0) {
      held.current = null;
    }
  }

  return (
    <DraggableContext.Provider
      value={{
        setHeld(el) {
          held.current = el;
        },
      }}
    >
      {children({
        onPointerMove: update,
        onPointerUp: update,
        onPointerLeave: update,
      })}
    </DraggableContext.Provider>
  );
}

export function Draggable(props: {
  children: (props: { onPointerDown: PointerEventHandler }) => ReactNode;
  handler: DragHandler;
}) {
  const { children, handler } = props;
  const { setHeld } = useContext(DraggableContext);

  return children({
    onPointerDown(e) {
      if (e.button === LMOUSE) {
        setHeld(handler);
      }
    },
  });
}

type SVGDragHandler<TEl> = (
  e: PointerEvent,
  svg: TEl,
  pos: { x: number; y: number }
) => { x: number; y: number };

export function DraggableSVG<TEl extends SVGGraphicsElement>(props: {
  handler: SVGDragHandler<TEl>;
  children: (props: {
    onPointerDown: PointerEventHandler;
    ref: Ref<TEl>;
  }) => ReactNode;
}) {
  const { handler, children } = props;
  const ref = useRef<TEl | null>(null);

  return (
    <Draggable
      handler={(e) => {
        const { current } = ref;
        if (!current) {
          return;
        }
        const rect = current.getBoundingClientRect();
        const dx = e.clientX - (rect.right + rect.left) / 2;
        const dy = e.clientY - (rect.bottom + rect.top) / 2;
        const list = current.transform.baseVal;
        if (
          list[list.length - 1]?.type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
        ) {
          let root: ParentNode = current;
          while (!(root instanceof SVGSVGElement)) {
            root = root.parentNode!;
          }
          list.appendItem(root.createSVGTransform());
          list[list.length - 1].setTranslate(0, 0);
        }
        const t = list[list.length - 1];
        const { x, y } = handler(e, current, {
          x: t.matrix.e + dx,
          y: t.matrix.f + dy,
        });
        t.setTranslate(x, y);
      }}
    >
      {(inner) => children({ ...inner, ref })}
    </Draggable>
  );
}

function toNearest(raw: number, bin: number) {
  return Math.round(raw / bin) * bin;
}

function Marker(
  props: {
    type: MarkerType;
    size: number;
    ref?: RefCallback<SVGGraphicsElement>;
  } & PropsWithoutRef<SVGProps<SVGGraphicsElement>>
) {
  const { type, size, ref, ...svgProps } = props;
  const r = size / 2;
  switch (type) {
    case "Circle":
      return <circle ref={ref} r={r} {...svgProps} />;
    case "Square":
      return (
        <rect
          ref={ref}
          x={-r}
          y={-r}
          width={size}
          height={size}
          {...svgProps}
        />
      );
    case "Triangle":
      return (
        <polygon
          ref={ref}
          points={`${-r},${r} 0,${-r} ${r},${r}`}
          {...svgProps}
        />
      );
    case "Cross":
      return (
        <path
          d={`M ${-r},${-r} L ${r},${r} M ${r},${-r} L ${-r},${r}`}
          {...svgProps}
        />
      );
    case "Star":
      return (
        <path
          d="m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z"
          transform="scale(0.3) translate(-25, -25)"
          {...svgProps}
          strokeWidth={Number(svgProps.strokeWidth || 1) / 0.3}
        />
      );
    default:
      return <></>;
  }
}

function CharMarker(
  props: {
    handler: SVGDragHandler<SVGGElement>;
    character: CharacterRecord;
  } & ComponentProps<"g">
) {
  const { handler, character, ...gProps } = props;

  return (
    <DraggableSVG handler={handler}>
      {(inner) => (
        <g
          {...inner}
          transform={`translate(${character.position?.x || 0},${character.position?.y || 0})`}
          {...gProps}
        >
          <Marker
            size={10}
            fill={character.color}
            className="stroke-foreground"
            type={character.marker || "Circle"}
          />
          <text
            y={-20}
            textAnchor="middle"
            className="fill-foreground cursor-default pointer-events-none"
          >
            {character.name}
          </text>
        </g>
      )}
    </DraggableSVG>
  );
}

export function BattleMap(props: { form: UseFormReturn<SelectForm> }) {
  const { form } = props;
  const characters = useWatch({
    control: form.control,
    name: "character.list",
  });

  return (
    <DraggableProvider>
      {(props) => (
        <svg height={500} {...props}>
          <defs>
            <pattern
              x={0}
              y={0}
              width={20}
              height={20}
              id="battleGrid"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x={0}
                y={0}
                width={20}
                height={20}
                className="stroke-gray-500"
              />
            </pattern>
          </defs>
          <rect x={0} y={0} width={500} height={500} fill="url(#battleGrid)" />
          {characters.map((character, idx) => (
            <CharMarker
              key={idx}
              character={character}
              handler={(e, svg, pos) => {
                if (e.buttons) {
                  return pos;
                }
                const newPos = {
                  x: toNearest(pos.x, 20),
                  y: toNearest(pos.y, 20),
                };
                form.setValue(`character.list.${idx}.position`, newPos);
                return newPos;
              }}
            />
          ))}
        </svg>
      )}
    </DraggableProvider>
  );
}
