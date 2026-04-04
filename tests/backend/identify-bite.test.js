import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { app } from '../../server';

const request = supertest(app);

describe('POST /api/identify-bite 集成测试', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('缺少 imageData 应返回 400', async () => {
    const res = await request.post('/api/identify-bite').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('缺少图片数据');
  });

  it('imageData 为空字符串应返回 400', async () => {
    const res = await request.post('/api/identify-bite').send({ imageData: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('缺少图片数据');
  });

  it('AI 成功响应应返回结构化结果', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        model: 'glm-5v-turbo',
        usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        choices: [{
          message: {
            content: JSON.stringify({
              damage_type: 'hole',
              damage_type_cn: '洞孔式',
              confidence: 85,
              feeding_guild: 'chewer',
              insects_possible: ['鳞翅目幼虫'],
              description: '叶片上有圆形穿孔',
              ecological_context: '典型咀嚼式取食痕迹',
              key_features: ['圆形', '边缘光滑'],
              plant_defense_response: '产生次生代谢物'
            })
          }
        }]
      })
    };

    global.fetch = async () => mockResponse;

    const res = await request.post('/api/identify-bite').send({
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      filename: 'test-leaf.jpg'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.damage_type).toBe('hole');
    expect(res.body.model).toBe('glm-5v-turbo');
    expect(res.body.usage).toBeDefined();
  });

  it('AI API 错误（非2xx）应返回 500', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    const res = await request.post('/api/identify-bite').send({
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  it('AI 返回非JSON内容应优雅降级（raw_response）', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        model: 'test-model',
        usage: {},
        choices: [{
          message: { content: '这是一段纯文本分析结果，没有JSON格式' }
        }]
      })
    });

    const res = await request.post('/api/identify-bite').send({
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.raw_response).toBeDefined();
  });

  it('应将 filename 传递给 AI 提示词', async () => {
    let capturedBody = null;
    global.fetch = async (url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        json: async () => ({
          model: 'test',
          usage: {},
          choices: [{ message: { content: '{"damage_type":"unknown"}' } }]
        })
      };
    };

    await request.post('/api/identify-bite').send({
      imageData: 'data:image/jpeg;base64,abc123',
      filename: 'my-special-leaf.jpg'
    });

    expect(capturedBody).not.toBeNull();
    const userContent = capturedBody.messages[1].content;
    // filename 应出现在 user prompt 中
    const hasFilename = Array.isArray(userContent)
      ? userContent.some(c => c.text?.includes('my-special-leaf.jpg'))
      : userContent.includes('my-special-leaf.jpg');
    expect(hasFilename).toBe(true);
  });
});
