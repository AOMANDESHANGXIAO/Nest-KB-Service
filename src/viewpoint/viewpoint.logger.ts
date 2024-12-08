import PubSub from 'src/utils/eventEmitter';

/**
 * 发布订阅的事件及处理函数定义
 */
interface Event {
  checkViewPoint: {
    checked_viewpoint_id: number;
    student_id: number;
  };
}

class ViewpointLogger {
  pubsub: PubSub<Event>;
  constructor() {
    this.pubsub = new PubSub<Event>();
    /**
     * checkViewPoint事件
     */
    this.pubsub.subscribe('checkViewPoint', (data) => {
      console.log('checkViewPoint', data);
    });
  }
}
export const viewpointLogger = new ViewpointLogger();
