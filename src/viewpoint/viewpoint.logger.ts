import PubSub from 'src/utils/eventEmitter';
import { SqlService } from 'src/db';
/**
 * 发布订阅的事件及处理函数定义
 */
interface Event {
  /**
   * 检查观点
   */
  checkViewPoint: {
    service: SqlService;
    checked_viewpoint_id: number;
    student_id: number;
  };
  /**
   * 创建观点
   */
  createViewPoint: {
    service: SqlService;
    viewpoint_id: number;
    student_id: number;
  };
  /**
   * 修改观点
   */
  updateViewPoint: {
    service: SqlService;
    viewpoint_id: number;
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
    /**
     * createViewPoint事件
     */
    this.pubsub.subscribe('createViewPoint', (data) => {
      console.log('createViewPoint', data);
    });
    /**
     * updateViewPoint事件
     */
    this.pubsub.subscribe('updateViewPoint', (data) => {
      console.log('updateViewPoint', data);
    });
  }
}
export const viewpointLogger = new ViewpointLogger();
