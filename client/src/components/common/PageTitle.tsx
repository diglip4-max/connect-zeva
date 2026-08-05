// components/PageTitle.tsx
import { Helmet } from "react-helmet-async";

interface PageTitleProps {
  title?: string;
  unreadCount?: number;
  showNotification?: boolean;
}

export const PageTitle = ({
  title,
  unreadCount = 0,
  showNotification = false,
}: PageTitleProps) => {
  const appName = "Zeva Connect";
  const pageTitle = title ? `${title} - ${appName}` : appName;
  const showNotif = showNotification || unreadCount > 0;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <link
        rel="icon"
        type="image/svg+xml"
        href={showNotif ? "/favicon-notification.svg" : "/favicon.svg"}
      />
    </Helmet>
  );
};
