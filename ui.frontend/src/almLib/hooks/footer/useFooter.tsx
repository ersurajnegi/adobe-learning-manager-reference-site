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
import { useEffect, useState, useMemo } from 'react';
import { useAccount } from '../account';
import { RestAdapter } from '../../utils/restAdapter';
// @ts-ignore
import DOMPurify from 'dompurify';

type footerConfig = {
  htmlCode?: string;
  cssCode?: string;
};

type FooterData = {
  html: string;
  cssUrl: string;
};

// Function to inject CSS string directly into DOM
const injectCssString = (cssString: string) => {
  // Check if this CSS has already been injected
  const existingStyle = document.querySelector('style[data-footer-custom-css]');
  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement('style');
  style.setAttribute('data-footer-custom-css', 'true');
  style.textContent = cssString;
  document.head.appendChild(style);
};

export const useFooter = (footerConfig?: footerConfig) => {
  const { account } = useAccount();
  const [isFooterStylingEnabled, setIsFooterStylingEnabled] = useState(false);
  const [footerData, setFooterData] = useState<FooterData>({ html: '', cssUrl: '' });
  const [cssInjected, setCssInjected] = useState(false);

  const { htmlCode: propsHtml, cssCode: propsCss } = footerConfig || {};

  const isPropsBasedStyling = !!footerConfig;

  useEffect(() => {
    const setupFooter = async () => {
      if (isPropsBasedStyling) {
        // Inject CSS once
        if (propsCss && !cssInjected) {
          // Use propsCss directly (whether it's a URL or CSS content)
          injectCssString(propsCss);
          setCssInjected(true);
        }

        setIsFooterStylingEnabled(true);
        setFooterData({ html: propsHtml || '', cssUrl: propsCss || '' });
        return;
      }
      if (account.templatesConfig) {
        try {
          const templatesConfig = JSON.parse(account.templatesConfig);
          const footerStyling = templatesConfig.footerStyling;
          const footerContent = templatesConfig.footerContent;
          setIsFooterStylingEnabled(footerStyling);

          if (footerStyling && footerContent) {
            const cssUrl = footerContent.cssContentUrl;
            const htmlUrl = footerContent.htmlContentUrl;

            if (cssUrl && !cssInjected) {
              try {
                const url = new URL(cssUrl);
                url.searchParams.set('returnOrigin', 'true');
                const cssContent = (await RestAdapter.get({ url: url.toString() })) as string;
                injectCssString(cssContent);
                setCssInjected(true);
              } catch (err) {
                console.error('Error fetching CSS from API:', err);
              }
            }

            let html = '';
            if (htmlUrl) {
              const url = new URL(htmlUrl);
              url.searchParams.set('returnOrigin', 'true');
              html = (await RestAdapter.get({ url: url.toString() })) as string;
            }

            setFooterData({ html, cssUrl });
          }
        } catch (err) {
          console.error('Error setting up footer:', err);
          setFooterData({ html: '', cssUrl: '' });
        }
      }
    };

    setupFooter();
  }, [account, propsHtml, propsCss, isPropsBasedStyling, cssInjected]);

  // Add a hook to make all links open a new window
  DOMPurify.addHook('afterSanitizeAttributes', function (node: any) {
    if ('target' in node) {
      node.setAttribute('target', '_blank');
    }
    if (
      !node.hasAttribute('target') &&
      (node.hasAttribute('xlink:href') || node.hasAttribute('href'))
    ) {
      node.setAttribute('xlink:show', 'new');
    }
  });

  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(footerData.html), [footerData.html]);
  return {
    isFooterStylingEnabled,
    html: sanitizedHtml,
    cssUrl: footerData.cssUrl,
  };
};
