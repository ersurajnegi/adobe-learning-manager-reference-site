/*
Copyright 2021 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { useRef } from 'react';

interface ALMImageProps {
  UNSAFE_className?: string;
  altText: string;
  src: string;
  defaultImageSrc?: string;
}

const ALMImage: React.FC<ALMImageProps> = ({ altText, src, UNSAFE_className, defaultImageSrc }) => {
  const imageRef = useRef<HTMLImageElement>(null);

  const onError = () => {
    if (imageRef.current && defaultImageSrc) {
      imageRef.current.src = defaultImageSrc;
    }
  };
  return (
    <img ref={imageRef} className={UNSAFE_className} alt={altText} src={src} onError={onError} />
  );
};

export default ALMImage;
