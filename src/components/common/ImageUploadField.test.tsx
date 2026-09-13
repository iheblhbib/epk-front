import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { ImageUploadField } from '@/components/common/ImageUploadField'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const labels = {
  uploadLabel: 'Upload',
  changeLabel: 'Change',
  removeLabel: 'Remove',
  invalidFileError: 'Please choose an image under 5MB.',
}

describe('ImageUploadField', () => {
  it('shows a colored-initial fallback when no image is set', () => {
    render(<ImageUploadField imageUrl={null} fallbackLabel="Ada Lovelace" {...labels} onUpload={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: labels.removeLabel })).not.toBeInTheDocument()
  })

  it('shows the image and a remove button when an image is set', () => {
    render(
      <ImageUploadField
        imageUrl="https://example.com/avatar.webp"
        fallbackLabel="Ada Lovelace"
        {...labels}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute('src', 'https://example.com/avatar.webp')
    expect(screen.getByRole('button', { name: labels.removeLabel })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: labels.changeLabel })).toBeInTheDocument()
  })

  it('calls onUpload when a valid image file is selected', async () => {
    const onUpload = vi.fn()
    const user = userEvent.setup()
    render(<ImageUploadField imageUrl={null} fallbackLabel="Ada Lovelace" {...labels} onUpload={onUpload} onRemove={vi.fn()} />)

    const file = new File(['fake-bytes'], 'face.png', { type: 'image/png' })
    const input = screen.getByTestId('image-upload-input') as HTMLInputElement
    await user.upload(input, file)

    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('rejects a non-image file client-side without calling onUpload', async () => {
    const onUpload = vi.fn()
    // The input has accept="image/*", which userEvent.upload otherwise
    // enforces itself -- disable that here since we're testing the
    // component's own validation, the actual defense against a permissive
    // OS file picker or a browser that doesn't honor `accept`.
    const user = userEvent.setup({ applyAccept: false })
    render(<ImageUploadField imageUrl={null} fallbackLabel="Ada Lovelace" {...labels} onUpload={onUpload} onRemove={vi.fn()} />)

    const file = new File(['fake-bytes'], 'doc.pdf', { type: 'application/pdf' })
    const input = screen.getByTestId('image-upload-input') as HTMLInputElement
    await user.upload(input, file)

    expect(onUpload).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(labels.invalidFileError)
  })

  it('hides the upload/remove controls when read-only', () => {
    render(
      <ImageUploadField
        imageUrl="https://example.com/logo.webp"
        fallbackLabel="Acme Records"
        readOnly
        {...labels}
        onUpload={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByRole('img', { name: 'Acme Records' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: labels.changeLabel })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: labels.removeLabel })).not.toBeInTheDocument()
  })

  it('calls onRemove when the remove button is clicked', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()
    render(
      <ImageUploadField
        imageUrl="https://example.com/logo.webp"
        fallbackLabel="Acme Records"
        {...labels}
        onUpload={vi.fn()}
        onRemove={onRemove}
      />
    )

    await user.click(screen.getByRole('button', { name: labels.removeLabel }))

    expect(onRemove).toHaveBeenCalled()
  })
})
