import { DragDropContext, DragDropContextProps } from 'react-beautiful-dnd';

const DynamicDragDropContext = (props: DragDropContextProps) => {
  if (typeof window === 'undefined') return null;
  return <DragDropContext {...props} />;
};

export default DynamicDragDropContext; 