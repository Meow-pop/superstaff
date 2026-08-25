import { describe, expect, it } from 'vitest'

import { jobStatusLabel, stepStatusLabel } from './jobPresentation'

describe('job presentation', () => {
  it('translates lifecycle states into user-facing labels', () => {
    expect(jobStatusLabel('draft')).toBe('待启动')
    expect(jobStatusLabel('review')).toBe('待验收')
    expect(jobStatusLabel('done')).toBe('已完成')
  })

  it('translates step states', () => {
    expect(stepStatusLabel('pending')).toBe('等待')
    expect(stepStatusLabel('failed')).toBe('失败')
  })
})
