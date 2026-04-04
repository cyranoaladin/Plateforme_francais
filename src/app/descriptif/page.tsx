import { redirect } from 'next/navigation';

// Redirect legacy descriptif to new descriptif-lecture
export default function DescriptifRedirect() {
  redirect('/descriptif-lecture');
}
