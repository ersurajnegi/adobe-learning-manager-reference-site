/**
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { render, screen, fireEvent } from '@testing-library/react';
import ALMImage from '@components/Common/ALMImage/ALMImage';

describe('ALMImage', () => {
  it('render_unsafeClassName_appliedToImg', () => {
    const { container } = render(
      <ALMImage src="https://example.com/img.jpg" altText="Test" UNSAFE_className="my-class" />
    );

    expect(container.querySelector('img')?.className).toBe('my-class');
  });

  it('error_withDefaultImageSrc_switchesToFallback', () => {
    render(
      <ALMImage
        src="https://example.com/broken.jpg"
        altText="Test"
        defaultImageSrc="https://example.com/fallback.jpg"
      />
    );

    fireEvent.error(screen.getByRole('img'));

    expect((screen.getByRole('img') as HTMLImageElement).src).toBe('https://example.com/fallback.jpg');
  });

  it('error_noDefaultImageSrc_srcUnchanged', () => {
    render(<ALMImage src="https://example.com/broken.jpg" altText="Test" />);

    fireEvent.error(screen.getByRole('img'));

    expect((screen.getByRole('img') as HTMLImageElement).src).toBe('https://example.com/broken.jpg');
  });

  it('error_emptyDefaultImageSrc_srcUnchanged', () => {
    render(
      <ALMImage src="https://example.com/broken.jpg" altText="Test" defaultImageSrc="" />
    );

    fireEvent.error(screen.getByRole('img'));

    expect((screen.getByRole('img') as HTMLImageElement).src).toBe('https://example.com/broken.jpg');
  });
});
