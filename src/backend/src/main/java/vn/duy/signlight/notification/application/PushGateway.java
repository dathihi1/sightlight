package vn.duy.signlight.notification.application;

import vn.duy.signlight.notification.domain.PushOutbox;

public interface PushGateway {

    String send(String firebaseInstallationId, PushOutbox delivery);
}
