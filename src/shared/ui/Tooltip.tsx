import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';

type Frame = { x: number; y: number; width: number; height: number };

type Props = {
  /** Текст подсказки; пусто — подсказки нет, остаётся только сам элемент */
  content: string | null | undefined;
  /** Один элемент с onPress (Pressable): подсказка появляется по долгому нажатию */
  children: ReactElement<{
    onLongPress?: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
  }>;
};

const SHOW_MS = 2500;
const MARGIN = 8;

/**
 * Подсказка на мобильном: наведения нет, поэтому — долгое нажатие. Пузырь над элементом
 * (или под ним у верхнего края), исчезает сам или по касанию. Экранный диктор читает
 * подсказку как accessibilityHint, если она не повторяет подпись. Подсказка не заменяет accessibilityLabel у иконок-кнопок.
 */
export function Tooltip({ content, children }: Props) {
  const anchor = useRef<View>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    if (!frame) return;
    const timer = setTimeout(() => setFrame(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [frame]);

  if (!content || !isValidElement(children)) return children as ReactNode;

  const show = () =>
    anchor.current?.measureInWindow((x, y, width, height) => {
      setBubbleWidth(0);
      setFrame({ x, y, width, height });
    });

  const child = cloneElement(children, {
    onLongPress: () => {
      children.props.onLongPress?.();
      show();
    },
    // Подсказка, совпадающая с подписью кнопки, диктору ничего не добавит
    accessibilityHint:
      children.props.accessibilityHint ??
      (content === children.props.accessibilityLabel ? undefined : content),
  });

  const below = frame !== null && frame.y < 80;
  // Центр пузыря — над центром элемента, но не за краями экрана
  const left = frame
    ? Math.min(
        Math.max(frame.x + frame.width / 2 - bubbleWidth / 2, MARGIN),
        screenWidth - bubbleWidth - MARGIN,
      )
    : 0;

  return (
    <>
      <View ref={anchor} collapsable={false}>
        {child}
      </View>
      <Modal
        visible={frame !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFrame(null)}
      >
        <Pressable className="flex-1" onPress={() => setFrame(null)}>
          {frame && (
            <View
              pointerEvents="none"
              onLayout={(e) => setBubbleWidth(e.nativeEvent.layout.width)}
              style={{
                position: 'absolute',
                left,
                maxWidth: Math.min(260, screenWidth - MARGIN * 2),
                // Пока ширина не измерена — не показываем, чтобы пузырь не прыгал
                opacity: bubbleWidth ? 1 : 0,
                ...(below
                  ? { top: frame.y + frame.height + MARGIN }
                  : { bottom: screenHeight - frame.y + MARGIN }),
              }}
              className="rounded-8 border border-line bg-popover px-[10px] py-[6px]"
            >
              <Text className="font-medium text-[12.5px] leading-4 text-text">{content}</Text>
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}
