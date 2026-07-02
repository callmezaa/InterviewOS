'use client';

import React from 'react';
import { Header } from '../../components/ui/Header';
import { DocsPage } from './DocsPage';

export default function Docs() {
  return (
    <>
      <Header subTitle="Documentation" />
      <DocsPage />
    </>
  );
}
