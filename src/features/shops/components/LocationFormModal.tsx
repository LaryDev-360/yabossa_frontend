import { FormEvent, useEffect, useState } from "react";
import { ApiError, getFieldError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import AddressAutocomplete from "../../places/components/AddressAutocomplete";
import type { PlaceSuggestion } from "../../places/types";
import { createLocation, updateLocation } from "../api";
import type { Location } from "../types";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  location?: Location | null;
  onSaved: () => void;
}

export default function LocationFormModal({
  isOpen,
  onClose,
  shopId,
  location,
  onSaved,
}: LocationFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(location);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [latitude, setLatitude] = useState<string | null>(null);
  const [longitude, setLongitude] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState("");
  const [placeProvider, setPlaceProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setName(location?.name ?? "");
    setAddress(location?.address ?? "");
    setCity(location?.city ?? "");
    setFormattedAddress(location?.formatted_address ?? "");
    setCountryCode(location?.country_code ?? "");
    setLatitude(location?.latitude ?? null);
    setLongitude(location?.longitude ?? null);
    setPlaceId(location?.place_id ?? "");
    setPlaceProvider(location?.place_provider ?? "");
    setPhoneNumber(location?.phone_number ?? "");
    setIsActive(location?.is_active ?? true);
    setError(null);
    setFieldErrors({});
  }, [isOpen, location]);

  function clearGeocodeFields() {
    setFormattedAddress("");
    setCountryCode("");
    setLatitude(null);
    setLongitude(null);
    setPlaceId("");
    setPlaceProvider("");
  }

  function handlePlaceSelect(suggestion: PlaceSuggestion) {
    setAddress(suggestion.address_line ?? suggestion.formatted_address);
    setCity(suggestion.city ?? "");
    setFormattedAddress(suggestion.formatted_address);
    setCountryCode(suggestion.country_code ?? "");
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    setPlaceId(suggestion.place_id);
    setPlaceProvider("nominatim");
  }

  function handleManualModeChange(manual: boolean) {
    if (manual) {
      clearGeocodeFields();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      formatted_address: formattedAddress.trim() || undefined,
      country_code: countryCode.trim() || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      place_id: placeId.trim() || undefined,
      place_provider: placeProvider.trim() || undefined,
      phone_number: phoneNumber.trim() || undefined,
      is_active: isActive,
    };

    try {
      if (isEdit && location) {
        await updateLocation(shopId, location.id, payload);
      } else {
        await createLocation(shopId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const next: Record<string, string> = {};
        for (const key of Object.keys(err.fieldErrors)) {
          const msg = getFieldError(err.fieldErrors, key);
          if (msg) {
            next[key] = msg;
          }
        }
        setFieldErrors(next);
      } else {
        setError(t("locations.formErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6 lg:p-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? t("locations.editLocation") : t("locations.addLocation")}
        </h3>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("locations.formErrorTitle")} message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>
              {t("locations.name")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.name)}
              hint={fieldErrors.name}
              required
            />
          </div>

          <AddressAutocomplete
            address={address}
            city={city}
            formattedAddress={formattedAddress}
            disabled={isSubmitting}
            onAddressChange={setAddress}
            onCityChange={setCity}
            onSelect={handlePlaceSelect}
            onManualModeChange={handleManualModeChange}
          />

          <div>
            <Label>{t("locations.phone")}</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            {t("locations.active")}
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
