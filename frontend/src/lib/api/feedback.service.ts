import api from './axios';

export interface FeedbackPayload {
  category: 'bug' | 'feature' | 'improvement' | 'general';
  rating: number;
  message: string;
}

export interface FeedbackItem {
  id: number;
  userId: number;
  username: string;
  category: string;
  rating: number;
  message: string;
  createdAt: string;
}

const feedbackService = {
  /**
   * Submit new feedback
   */
  async submit(payload: FeedbackPayload): Promise<{ message: string; feedbackId: number }> {
    const res = await api.post('/feedback', payload);
    return res.data;
  },

  /**
   * Get current user's feedback history
   */
  async getMyFeedback(): Promise<FeedbackItem[]> {
    const res = await api.get('/feedback');
    return res.data;
  },
};

export default feedbackService;
