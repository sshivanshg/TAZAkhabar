import { render, screen } from '@testing-library/react-native'

let mockReduced = false
jest.mock('../src/hooks/usePrefersReducedMotion', () => ({
  ...jest.requireActual('../src/hooks/usePrefersReducedMotion'),
  usePrefersReducedMotion: () => mockReduced,
}))

import { SavePop } from '../src/components/article/ArticleActions'
import { ArticleSkeleton } from '../src/components/article/ArticleSkeleton'

describe('reduced motion paths (M2, M4)', () => {
  it('skips the save pop and skeleton pulse under reduced motion', () => {
    mockReduced = true
    const { rerender } = render(<SavePop saved={false}>{null}</SavePop>)
    rerender(<SavePop saved>{null}</SavePop>)
    expect(screen.getByTestId('save-pop-static')).toBeTruthy()
    expect(screen.queryByTestId('save-pop')).toBeNull()

    render(<ArticleSkeleton />)
    expect(screen.getByTestId('skeleton-static')).toBeTruthy()
  })

  it('pops on save and pulses the skeleton when motion is allowed', () => {
    mockReduced = false
    const { rerender } = render(<SavePop saved={false}>{null}</SavePop>)
    rerender(<SavePop saved>{null}</SavePop>)
    expect(screen.getByTestId('save-pop')).toBeTruthy()

    render(<ArticleSkeleton />)
    expect(screen.getByTestId('skeleton-pulse')).toBeTruthy()
  })
})
